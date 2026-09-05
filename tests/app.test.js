const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');
const request = require('supertest');
const { createApp } = require('../src/app');
const {
  createDatabase,
  createIncident,
  createIncidentComment,
  findIncidentById,
  getIncidentHistory,
  getIncidentTimeline,
  seedDemoData,
  seedInitialData,
  updateIncidentStatus
} = require('../src/db');
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

  describe('Comentários de Incidentes', () => {
    it('cria e exibe múltiplos comentários com autor, conteúdo e data', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Falha de integração', 'Investigando a causa.', 'High', 'Ana', 'Open')
      `).run();

      const firstResponse = await request(app)
        .post('/incidents/1/comments')
        .type('form')
        .send({ author: 'Ana', content: 'A falha começou após a última atualização.' });
      const secondResponse = await request(app)
        .post('/incidents/1/comments')
        .type('form')
        .send({ author: 'Bruno', content: 'A equipe de infraestrutura iniciou a análise.' });

      expect(firstResponse.status).toBe(302);
      expect(secondResponse.status).toBe(302);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_comments WHERE incident_id = 1').get().count).toBe(2);

      const detailResponse = await request(app).get('/incidents/1');
      expect(detailResponse.status).toBe(200);
      expect(detailResponse.text).toContain('Ana');
      expect(detailResponse.text).toContain('A falha começou após a última atualização.');
      expect(detailResponse.text).toContain('Bruno');
      expect(detailResponse.text).toContain('A equipe de infraestrutura iniciou a análise.');
    });

    it('rejeita comentário sem autor ou conteúdo', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Falha de integração', 'Investigando a causa.', 'High', 'Ana', 'Open')
      `).run();

      const response = await request(app)
        .post('/incidents/1/comments')
        .type('form')
        .send({ author: ' ', content: ' ' });

      expect(response.status).toBe(422);
      expect(response.text).toContain('Informe o autor do comentário.');
      expect(response.text).toContain('Escreva o conteúdo do comentário.');
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_comments').get().count).toBe(0);
    });

    it('inclui comentários e mudanças de status na linha do tempo', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Falha de integração', 'Investigando a causa.', 'High', 'Ana', 'Open')
      `).run();
      db.prepare(`UPDATE incidents SET created_at = '2026-09-05 10:00:00', updated_at = '2026-09-05 10:00:00' WHERE id = 1`).run();

      await request(app).post('/incidents/1/comments').type('form').send({ author: 'Ana', content: 'Provider contacted.' });
      db.prepare(`UPDATE incident_comments SET created_at = '2026-09-05 10:42:00' WHERE incident_id = 1`).run();
      await request(app).post('/incidents/1/status').type('form').send({ status: 'In Progress' });
      db.prepare(`UPDATE incident_history SET changed_at = '2026-09-05 10:31:00' WHERE incident_id = 1`).run();

      const timeline = getIncidentTimeline(db, 1);
      expect(timeline.map((item) => item.event_type)).toEqual(['status', 'comment']);
      expect(timeline[0].to_status).toBe('In Progress');
      expect(timeline[1].content).toBe('Provider contacted.');
      const response = await request(app).get('/incidents/1');
      expect(response.text).toContain('Provider contacted.');
      expect(response.text).toContain('Histórico de atividade');
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
      expect(detailResponse.text).toContain('Histórico de atividade');
      const statusEvents = detailResponse.text.match(/class="history-change"/g) || [];
      expect(statusEvents.length).toBe(2);
      expect(detailResponse.text).toContain('history-arrow');
      expect(detailResponse.text).toContain('status-open');
      expect(detailResponse.text).toContain('status-in-progress');
      expect(detailResponse.text).toContain('status-resolved');
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

    it('repõe exemplos ausentes sem remover dados existentes', () => {
      const db = createDatabase(':memory:');
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Incidente do avaliador', 'Dado próprio.', 'Low', 'Equipe', 'Open')
      `).run();

      expect(seedDemoData(db)).toBe(true);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incidents').get().count).toBe(4);
      expect(findIncidentById(db, 1).title).toBe('Incidente do avaliador');
      expect(seedDemoData(db)).toBe(false);
    });
  });

  describe('Linha do Tempo de Atividade (Requisito 10)', () => {
    it('intercala comentários e mudanças de status em ordem cronológica', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Falha de integração', 'Investigando a causa.', 'High', 'Ana', 'Open')
      `).run();
      db.prepare(`UPDATE incidents SET created_at = '2026-09-05 09:00:00', updated_at = '2026-09-05 09:00:00' WHERE id = 1`).run();

      await request(app).post('/incidents/1/comments').type('form').send({ author: 'Ana', content: 'Triagem iniciada.' });
      db.prepare(`UPDATE incident_comments SET created_at = '2026-09-05 09:10:00' WHERE incident_id = 1`).run();
      await request(app).post('/incidents/1/status').type('form').send({ status: 'In Progress' });
      db.prepare(`UPDATE incident_history SET changed_at = '2026-09-05 09:20:00' WHERE incident_id = 1`).run();
      await request(app).post('/incidents/1/comments').type('form').send({ author: 'Bruno', content: 'Root cause identificada.' });
      db.prepare(`UPDATE incident_comments SET created_at = '2026-09-05 09:30:00' WHERE content = 'Root cause identificada.'`).run();
      await request(app).post('/incidents/1/status').type('form').send({ status: 'Resolved' });
      db.prepare(`UPDATE incident_history SET changed_at = '2026-09-05 09:40:00' WHERE from_status = 'In Progress'`).run();

      const timeline = getIncidentTimeline(db, 1);
      expect(timeline.map((item) => item.event_type)).toEqual(['comment', 'status', 'comment', 'status']);
      expect(timeline[0]).toMatchObject({ event_type: 'comment', author: 'Ana', content: 'Triagem iniciada.' });
      expect(timeline[1]).toMatchObject({ event_type: 'status', from_status: 'Open', to_status: 'In Progress' });
      expect(timeline[2]).toMatchObject({ event_type: 'comment', author: 'Bruno', content: 'Root cause identificada.' });
      expect(timeline[3]).toMatchObject({ event_type: 'status', from_status: 'In Progress', to_status: 'Resolved' });
    });

    it('mantém ordem determinística quando status e comentário ocorrem na mesma data/hora', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Falha de integração', 'Investigando a causa.', 'High', 'Ana', 'Open')
      `).run();

      await request(app).post('/incidents/1/comments').type('form').send({ author: 'Ana', content: 'Evento simultâneo.' });
      db.prepare(`UPDATE incident_comments SET created_at = '2026-09-05 10:00:00' WHERE incident_id = 1`).run();
      await request(app).post('/incidents/1/status').type('form').send({ status: 'In Progress' });
      db.prepare(`UPDATE incident_history SET changed_at = '2026-09-05 10:00:00' WHERE incident_id = 1`).run();

      const timeline = getIncidentTimeline(db, 1);
      expect(timeline.length).toBe(2);
      expect(timeline.map((item) => item.event_type)).toEqual(['status', 'comment']);
    });

    it('renderiza mudanças de status e comentários com marcações distintas', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Falha de integração', 'Investigando a causa.', 'High', 'Ana', 'Open')
      `).run();

      await request(app).post('/incidents/1/comments').type('form').send({ author: 'Ana', content: 'Provider contacted.' });
      await request(app).post('/incidents/1/status').type('form').send({ status: 'In Progress' });

      const response = await request(app).get('/incidents/1');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Histórico de atividade');
      expect((response.text.match(/class="history-change"/g) || []).length).toBe(1);
      expect(response.text).toContain('history-arrow');
      expect(response.text).toContain('history-comment');
      expect(response.text).toContain('Ana comentou:');
      expect(response.text).toContain('“Provider contacted.”');
    });

    it('exibe mensagem de linha do tempo vazia quando não há atividades', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Falha isolada', 'Sem atividades ainda.', 'Low', 'Ana', 'Open')
      `).run();

      expect(getIncidentTimeline(db, 1)).toEqual([]);

      const response = await request(app).get('/incidents/1');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Nenhuma atividade registrada até o momento.');
    });

    it('remove histórico de status e comentários em cascata ao excluir o incidente', async () => {
      const { app, db } = testApplication();
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Incidente para exclusão', 'Registro com atividades.', 'Medium', 'Ana', 'Open')
      `).run();

      await request(app).post('/incidents/1/comments').type('form').send({ author: 'Ana', content: 'Acompanhamento registrado.' });
      await request(app).post('/incidents/1/status').type('form').send({ status: 'In Progress' });

      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_history WHERE incident_id = 1').get().count).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_comments WHERE incident_id = 1').get().count).toBe(1);

      const response = await request(app).post('/incidents/1/delete');
      expect(response.status).toBe(302);

      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_history').get().count).toBe(0);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_comments').get().count).toBe(0);
      expect(getIncidentTimeline(db, 1)).toEqual([]);
    });

    it('persiste linha do tempo, histórico e comentários ao reabrir a base em disco', () => {
      const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'incident-hub-'));
      const databasePath = path.join(tempDirectory, 'incident-hub.db');

      let db = createDatabase(databasePath);
      const incident = createIncident(db, {
        title: 'Instabilidade persistente',
        description: 'Registro usado para validar a persistência da linha do tempo.',
        severity: 'High',
        assignee: 'Ana'
      });
      createIncidentComment(db, incident.id, { author: 'Ana', content: 'Persistência validada.' });
      db.prepare(`UPDATE incident_comments SET created_at = '2026-09-05 10:00:00' WHERE incident_id = ?`).run(incident.id);
      updateIncidentStatus(db, incident.id, 'In Progress');
      db.prepare(`UPDATE incident_history SET changed_at = '2026-09-05 10:05:00' WHERE incident_id = ?`).run(incident.id);
      db.close();

      db = createDatabase(databasePath);
      const timeline = getIncidentTimeline(db, incident.id);
      expect(timeline.map((item) => item.event_type)).toEqual(['comment', 'status']);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_history').get().count).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_comments').get().count).toBe(1);
      db.close();

      fs.rmSync(tempDirectory, { recursive: true, force: true });
    });
  });

  describe('Consistência de Estado ao Atualizar o Sistema', () => {
    function fileBasedDatabase() {
      const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'incident-hub-'));
      const databasePath = path.join(tempDirectory, 'incident-hub.db');
      return { tempDirectory, databasePath };
    }

    it('preserva incidentes existentes ao atualizar o esquema para incluir comentários e histórico', () => {
      const { tempDirectory, databasePath } = fileBasedDatabase();

      let db = new Database(databasePath);
      db.exec(`
        CREATE TABLE incidents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          identifier TEXT UNIQUE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          severity TEXT NOT NULL,
          assignee TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Open',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      db.prepare(`
        INSERT INTO incidents (identifier, title, description, severity, assignee, status)
        VALUES ('INC-0001', 'Incidente legado', 'Registro anterior à versão atual.', 'High', 'Ana', 'Open')
      `).run();
      db.close();

      db = createDatabase(databasePath);
      const legacy = findIncidentById(db, 1);
      expect(legacy.title).toBe('Incidente legado');

      createIncidentComment(db, legacy.id, { author: 'Ana', content: 'Comentário após atualização.' });
      updateIncidentStatus(db, legacy.id, 'In Progress');

      expect(getIncidentTimeline(db, legacy.id).length).toBe(2);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_comments').get().count).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_history').get().count).toBe(1);
      db.close();

      fs.rmSync(tempDirectory, { recursive: true, force: true });
    });

    it('preserva incidentes, comentários e histórico íntegros ao reabrir a base', () => {
      const { tempDirectory, databasePath } = fileBasedDatabase();

      let db = createDatabase(databasePath);
      const incident = createIncident(db, {
        title: 'Falha persistente',
        description: 'Registro com atividades para validar atualização do sistema.',
        severity: 'High',
        assignee: 'Ana'
      });
      createIncidentComment(db, incident.id, { author: 'Ana', content: 'Primeiro comentário.' });
      db.prepare(`UPDATE incident_comments SET created_at = '2026-09-05 10:00:00' WHERE incident_id = ?`).run(incident.id);
      createIncidentComment(db, incident.id, { author: 'Bruno', content: 'Segundo comentário.' });
      db.prepare(`UPDATE incident_comments SET created_at = '2026-09-05 10:10:00' WHERE id = (SELECT MAX(id) FROM incident_comments WHERE incident_id = ?)`).run(incident.id);
      updateIncidentStatus(db, incident.id, 'In Progress');
      db.prepare(`UPDATE incident_history SET changed_at = '2026-09-05 10:20:00' WHERE incident_id = ?`).run(incident.id);
      updateIncidentStatus(db, incident.id, 'Resolved');
      db.prepare(`UPDATE incident_history SET changed_at = '2026-09-05 10:30:00' WHERE to_status = 'Resolved' AND incident_id = ?`).run(incident.id);
      db.close();

      let reopened = createDatabase(databasePath);
      const stored = findIncidentById(reopened, incident.id);
      expect(stored).toMatchObject({
        identifier: incident.identifier,
        title: 'Falha persistente',
        description: 'Registro com atividades para validar atualização do sistema.',
        severity: 'High',
        assignee: 'Ana',
        status: 'Resolved'
      });

      expect(reopened.prepare('SELECT author, content FROM incident_comments WHERE incident_id = ? ORDER BY id ASC').all(incident.id)).toEqual([
        { author: 'Ana', content: 'Primeiro comentário.' },
        { author: 'Bruno', content: 'Segundo comentário.' }
      ]);

      expect(getIncidentHistory(reopened, incident.id).map((item) => [item.from_status, item.to_status])).toEqual([
        ['Open', 'In Progress'],
        ['In Progress', 'Resolved']
      ]);

      expect(getIncidentTimeline(reopened, incident.id).map((item) => item.event_type)).toEqual(['comment', 'comment', 'status', 'status']);

      reopened.close();

      const reopenedAgain = createDatabase(databasePath);
      expect(findIncidentById(reopenedAgain, incident.id).status).toBe('Resolved');
      expect(reopenedAgain.prepare('SELECT COUNT(*) AS count FROM incident_comments').get().count).toBe(2);
      expect(reopenedAgain.prepare('SELECT COUNT(*) AS count FROM incident_history').get().count).toBe(2);
      reopenedAgain.close();

      fs.rmSync(tempDirectory, { recursive: true, force: true });
    });

    it('mantém o status do incidente consistente com a última transição registrada', () => {
      const { tempDirectory, databasePath } = fileBasedDatabase();

      let db = createDatabase(databasePath);
      const incident = createIncident(db, {
        title: 'Lentidão operacional',
        description: 'Caso para validar consistência entre incidente e histórico.',
        severity: 'Medium',
        assignee: 'Bruno'
      });
      updateIncidentStatus(db, incident.id, 'In Progress');
      updateIncidentStatus(db, incident.id, 'Resolved');
      db.close();

      db = createDatabase(databasePath);
      const history = getIncidentHistory(db, incident.id);
      const last = history[history.length - 1];
      expect(findIncidentById(db, incident.id).status).toBe(last.to_status);
      expect(last.to_status).toBe('Resolved');
      expect(getIncidentTimeline(db, incident.id).at(-1).to_status).toBe('Resolved');
      db.close();

      fs.rmSync(tempDirectory, { recursive: true, force: true });
    });

    it('não perde comentários e histórico existentes ao validar dados iniciais após reabrir', () => {
      const { tempDirectory, databasePath } = fileBasedDatabase();

      let db = createDatabase(databasePath);
      seedInitialData(db);
      const incident = findIncidentById(db, 1);
      createIncidentComment(db, incident.id, { author: 'Ana', content: 'Contexto preservado.' });
      db.prepare(`UPDATE incident_comments SET created_at = '2026-09-05 10:00:00' WHERE incident_id = ?`).run(incident.id);
      updateIncidentStatus(db, incident.id, 'In Progress');
      db.prepare(`UPDATE incident_history SET changed_at = '2026-09-05 10:05:00' WHERE incident_id = ?`).run(incident.id);
      db.close();

      db = createDatabase(databasePath);
      expect(seedInitialData(db)).toBe(false);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incidents').get().count).toBe(3);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_comments').get().count).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS count FROM incident_history').get().count).toBe(1);
      expect(getIncidentTimeline(db, incident.id).map((item) => item.event_type)).toEqual(['comment', 'status']);
      db.close();

      fs.rmSync(tempDirectory, { recursive: true, force: true });
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
