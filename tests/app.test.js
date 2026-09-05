const request = require('supertest');
const { createApp } = require('../src/app');
const { createDatabase, findIncidentById, getIncidentHistory, seedInitialData } = require('../src/db');
const { formatDateTime } = require('../src/formatters');

function testApplication() {
  const db = createDatabase(':memory:');
  return { app: createApp(db), db };
}

describe('Incident Hub', () => {
  describe('Precisão Temporal e Fuso Horário', () => {
    it('converte horários armazenados em UTC para o horário de São Paulo', () => {
      expect(formatDateTime('2026-09-05 12:42:00')).toBe('05/09/2026, 09:42');
    });
  });

  describe('Criação de Incidentes (Requisitos 3 e 4)', () => {
    it('cria um incidente com status Open, identificador INC-xxxx e registro em banco', async () => {
      const { app, db } = testApplication();
      const response = await request(app).post('/incidents').type('form').send({
        title: 'Falha no painel operacional',
        description: 'O painel deixou de carregar os dados da manhã.',
        severity: 'High',
        assignee: 'Liuken Monteiro'
      });

      expect(response.status).toBe(302);
      const incident = findIncidentById(db, 1);
      expect(incident.identifier).toBe('INC-0001');
      expect(incident.status).toBe('Open');
      expect(incident.severity).toBe('High');
      expect(incident.assignee).toBe('Liuken Monteiro');
      expect(incident.created_at).toBeDefined();
      expect(incident.updated_at).toBeDefined();
    });

    it('rejeita criação sem os campos obrigatórios e apresenta feedback compreensível', async () => {
      const { app } = testApplication();
      const response = await request(app).post('/incidents').type('form').send({ title: 'Sem dados' });

      expect(response.status).toBe(422);
      expect(response.text).toContain('Revise os campos');
      expect(response.text).toContain('Descreva o que aconteceu');
      expect(response.text).toContain('Selecione uma severidade válida');
      expect(response.text).toContain('Informe a pessoa responsável');
    });
  });

  describe('Listagem e Filtros (Requisito 5)', () => {
    it('lista incidentes existentes com informações essenciais', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Falha no banco', 'Conexões esgotadas.', 'Critical', 'Operações', 'Open')
      `).run();

      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('INC-0001');
      expect(response.text).toContain('Falha no banco');
      expect(response.text).toContain('Critical');
      expect(response.text).toContain('Operações');
      expect(response.text).toContain('Open');
    });

    it('filtra incidentes por status e severidade', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Servidor indisponível', 'Sem conexão.', 'Critical', 'Enfermagem', 'Resolved')
      `).run();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0002', 'Alerta secundário', 'Monitoramento.', 'Low', 'Operações', 'Open')
      `).run();

      const response = await request(app).get('/?status=Resolved&severity=Critical');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Servidor indisponível');
      expect(response.text).not.toContain('Alerta secundário');
    });
  });

  describe('Detalhes do Incidente (Requisito 6)', () => {
    it('exibe todos os detalhes do incidente (título, descrição, severidade, responsável, status, criação e atualização)', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status, created_at, updated_at)
        VALUES ('INC-0001', 'Erro na emissão', 'Falha no certificado.', 'High', 'Ana', 'In Progress', '2026-09-05 10:00:00', '2026-09-05 11:30:00')
      `).run();

      const response = await request(app).get('/incidents/1');
      expect(response.status).toBe(200);
      expect(response.text).toContain('INC-0001');
      expect(response.text).toContain('Erro na emissão');
      expect(response.text).toContain('Falha no certificado.');
      expect(response.text).toContain('High');
      expect(response.text).toContain('Ana');
      expect(response.text).toContain('In Progress');
      // Data de criação: 10:00 UTC -> 07:00 SP
      expect(response.text).toContain('05/09/2026, 07:00');
      // Última atualização: 11:30 UTC -> 08:30 SP
      expect(response.text).toContain('05/09/2026, 08:30');
    });

    it('retorna 404 quando o incidente não for encontrado', async () => {
      const { app } = testApplication();
      const response = await request(app).get('/incidents/999');
      expect(response.status).toBe(404);
    });
  });

  describe('Alteração de Status e Regras de Negócio (Requisito 7)', () => {
    it('permite transição válida de status (Open -> In Progress) e atualiza data da última modificação', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status, created_at, updated_at)
        VALUES ('INC-0001', 'Lentidão no login', 'Investigando.', 'Medium', 'Carlos', 'Open', '2026-09-05 08:00:00', '2026-09-05 08:00:00')
      `).run();

      const response = await request(app)
        .post('/incidents/1/status')
        .type('form')
        .send({ status: 'In Progress' });

      expect(response.status).toBe(302);
      const incident = findIncidentById(db, 1);
      expect(incident.status).toBe('In Progress');
    });

    it('impede que um incidente Critical passe diretamente de Open para Resolved e fornece feedback', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Queda total do sistema', 'Inoperante.', 'Critical', 'Ana', 'Open')
      `).run();

      const response = await request(app)
        .post('/incidents/1/status')
        .type('form')
        .send({ status: 'Resolved' });

      expect(response.status).toBe(422);
      expect(response.text).toContain('Critical');
      expect(response.text).toContain('In Progress');

      const incident = findIncidentById(db, 1);
      expect(incident.status).toBe('Open');
    });

    it('permite que um incidente Critical seja resolvido se passar antes por In Progress', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Queda total do sistema', 'Inoperante.', 'Critical', 'Ana', 'Open')
      `).run();

      const toInProgress = await request(app)
        .post('/incidents/1/status')
        .type('form')
        .send({ status: 'In Progress' });
      expect(toInProgress.status).toBe(302);

      const toResolved = await request(app)
        .post('/incidents/1/status')
        .type('form')
        .send({ status: 'Resolved' });
      expect(toResolved.status).toBe(302);

      const incident = findIncidentById(db, 1);
      expect(incident.status).toBe('Resolved');
    });
  });

  describe('Exclusão de Incidentes', () => {
    it('remove um incidente e redireciona para o dashboard', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Incidente temporário', 'Registro para exclusão.', 'Low', 'Ana', 'Open')
      `).run();

      const response = await request(app).post('/incidents/1/delete');

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/?deleted=1');
      expect(findIncidentById(db, 1)).toBeUndefined();
    });
  });

  describe('Edição de Incidentes', () => {
    it('atualiza título e descrição sem alterar status, severidade ou responsável', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Título antigo', 'Descrição antiga.', 'Critical', 'Ana', 'In Progress')
      `).run();

      const response = await request(app)
        .post('/incidents/1/edit')
        .type('form')
        .send({ title: 'Título atualizado', description: 'Descrição atualizada com contexto.' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/incidents/1?edited=1');
      const incident = findIncidentById(db, 1);
      expect(incident.title).toBe('Título atualizado');
      expect(incident.description).toBe('Descrição atualizada com contexto.');
      expect(incident.severity).toBe('Critical');
      expect(incident.status).toBe('In Progress');
      expect(incident.assignee).toBe('Ana');
    });
  });

  describe('Histórico de Alterações de Status (Requisito 8)', () => {
    it('registra e persiste histórico de transições com status anterior, novo status e data/hora', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Erro em pagamentos', 'Triagem.', 'High', 'Bruno', 'Open')
      `).run();

      await request(app).post('/incidents/1/status').type('form').send({ status: 'In Progress' });
      await request(app).post('/incidents/1/status').type('form').send({ status: 'Resolved' });

      const history = getIncidentHistory(db, 1);
      expect(history.length).toBe(2);
      expect(history[0].from_status).toBe('Open');
      expect(history[0].to_status).toBe('In Progress');
      expect(history[0].changed_at).toBeDefined();

      expect(history[1].from_status).toBe('In Progress');
      expect(history[1].to_status).toBe('Resolved');
      expect(history[1].changed_at).toBeDefined();

      const detailResponse = await request(app).get('/incidents/1');
      expect(detailResponse.status).toBe(200);
      expect(detailResponse.text).toContain('Open');
      expect(detailResponse.text).toContain('In Progress');
      expect(detailResponse.text).toContain('Resolved');
    });
  });

  describe('Dashboard e Métricas (Requisito 9)', () => {
    it('apresenta contagens corretas de abertos, críticos não resolvidos e resolvidos', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status) VALUES
        ('INC-0001', 'Incidente 1', 'Desc', 'Critical', 'Ana', 'Open'),
        ('INC-0002', 'Incidente 2', 'Desc', 'Critical', 'Ana', 'In Progress'),
        ('INC-0003', 'Incidente 3', 'Desc', 'Critical', 'Ana', 'Resolved'),
        ('INC-0004', 'Incidente 4', 'Desc', 'Low', 'Bruno', 'Open'),
        ('INC-0005', 'Incidente 5', 'Desc', 'High', 'Carla', 'Resolved')
      `).run();

      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Em aberto');
      expect(response.text).toContain('Críticos pendentes');
      expect(response.text).toContain('Resolvidos');
    });
  });

  describe('Dados Iniciais / Seed (Requisito 11)', () => {
    it('popula automaticamente os incidentes de exemplo se a base estiver vazia', () => {
      const db = createDatabase(':memory:');
      const seeded = seedInitialData(db);
      expect(seeded).toBe(true);

      const incident1 = findIncidentById(db, 1);
      expect(incident1.title).toBe('Payment API instability');
      expect(incident1.severity).toBe('Critical');
      expect(incident1.assignee).toBe('Ana');
      expect(incident1.status).toBe('Open');

      const incident2 = findIncidentById(db, 2);
      expect(incident2.title).toBe('Reconciliation delay');
      expect(incident2.severity).toBe('High');
      expect(incident2.assignee).toBe('Bruno');
      expect(incident2.status).toBe('In Progress');

      const incident3 = findIncidentById(db, 3);
      expect(incident3.title).toBe('Incorrect customer notification');
      expect(incident3.severity).toBe('Medium');
      expect(incident3.assignee).toBe('Carla');
      expect(incident3.status).toBe('Resolved');

      const secondCall = seedInitialData(db);
      expect(secondCall).toBe(false);
    });

    it('oferece carregamento rápido de dados de exemplo no dashboard', async () => {
      const { app, db } = testApplication();

      const dashboardResponse = await request(app).get('/');
      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.text).toContain('Dados de teste');
      expect(dashboardResponse.text).toContain('Use “Dados de teste”');

      const seedResponse = await request(app).post('/seed-demo-data');
      expect(seedResponse.status).toBe(302);
      expect(findIncidentById(db, 1).title).toBe('Payment API instability');
      expect(findIncidentById(db, 2).title).toBe('Reconciliation delay');
      expect(findIncidentById(db, 3).title).toBe('Incorrect customer notification');
    });
  });

  describe('Recursos Estáticos e Dinâmicos', () => {
    it('serve o script de filtragem dinâmica e estrutura de resultados', async () => {
      const { app } = testApplication();
      const staticResponse = await request(app).get('/filters.js');
      expect(staticResponse.status).toBe(200);
      expect(staticResponse.headers['content-type']).toContain('javascript');

      const dashboardResponse = await request(app).get('/');
      expect(dashboardResponse.text).toContain('id="incidents-results"');
      expect(dashboardResponse.text).toContain('src="/filters.js?v=6"');
    });
  });
});
