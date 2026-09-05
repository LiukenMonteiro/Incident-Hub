const request = require('supertest');
const { createApp } = require('../src/app');
const { createDatabase, findIncidentById } = require('../src/db');
const { formatDateTime } = require('../src/formatters');

function testApplication() {
  const db = createDatabase(':memory:');
  return { app: createApp(db), db };
}

describe('Incident Hub', () => {
  it('converte horários armazenados em UTC para o horário de São Paulo', () => {
    expect(formatDateTime('2026-09-05 12:42:00')).toBe('05/09/2026, 09:42');
  });

  it('exibe o dashboard', async () => {
    const { app } = testApplication();
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Incidentes recentes');
  });

  it('cria um incidente com status Open e identificador', async () => {
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
  });

  it('filtra incidentes por status e severidade', async () => {
    const { app, db } = testApplication();
    const critical = db.prepare(`
      INSERT INTO incidents (identifier, title, description, severity, assignee, status)
      VALUES ('INC-0001', 'Servidor indisponível', 'Sem conexão.', 'Critical', 'Enfermagem', 'Resolved')
    `).run();
    db.prepare(`
      INSERT INTO incidents (identifier, title, description, severity, assignee, status)
      VALUES ('INC-0002', 'Alerta secundário', 'Monitoramento.', 'Low', 'Operações', 'Open')
    `).run();

    expect(critical.changes).toBe(1);
    const response = await request(app).get('/?status=Resolved&severity=Critical');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Servidor indisponível');
    expect(response.text).not.toContain('Alerta secundário');
  });

  it('rejeita criação sem os campos obrigatórios', async () => {
    const { app } = testApplication();
    const response = await request(app).post('/incidents').type('form').send({ title: 'Sem dados' });

    expect(response.status).toBe(422);
    expect(response.text).toContain('Revise os campos');
  });

  it('serve o script de filtragem dinâmica e estrutura de resultados', async () => {
    const { app } = testApplication();
    const staticResponse = await request(app).get('/filters.js');
    expect(staticResponse.status).toBe(200);
    expect(staticResponse.headers['content-type']).toContain('javascript');

    const dashboardResponse = await request(app).get('/');
    expect(dashboardResponse.text).toContain('id="incidents-results"');
    expect(dashboardResponse.text).toContain('src="/filters.js"');
  });
});
