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

  it('rejeita criação sem os campos obrigatórios', async () => {
    const { app } = testApplication();
    const response = await request(app).post('/incidents').type('form').send({ title: 'Sem dados' });

    expect(response.status).toBe(422);
    expect(response.text).toContain('Revise os campos');
  });
});
