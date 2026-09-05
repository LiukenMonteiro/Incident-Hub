const express = require('express');
const path = require('node:path');
const { formatDateTime } = require('./formatters');
const {
  SEVERITIES,
  STATUSES,
  createIncident,
  findIncidentById,
  getIncidentHistory,
  incidentSummary,
  listIncidents,
  updateIncidentStatus
} = require('./db');

function createApp(db) {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use((_request, response, next) => {
    response.locals.formatDateTime = formatDateTime;
    next();
  });

  app.get('/', (request, response) => {
    const filters = {
      status: STATUSES.includes(request.query.status) ? request.query.status : '',
      severity: SEVERITIES.includes(request.query.severity) ? request.query.severity : ''
    };

    response.render('dashboard', {
      incidents: listIncidents(db, filters),
      summary: incidentSummary(db),
      filters,
      severities: SEVERITIES,
      statuses: STATUSES
    });
  });

  app.get('/incidents/new', (_request, response) => {
    response.render('incident-form', { severities: SEVERITIES, values: {}, errors: [] });
  });

  app.post('/incidents', (request, response) => {
    const values = {
      title: request.body.title?.trim(),
      description: request.body.description?.trim(),
      severity: request.body.severity,
      assignee: request.body.assignee?.trim()
    };
    const errors = [];

    if (!values.title) errors.push('Informe um título para o incidente.');
    if (!values.description) errors.push('Descreva o que aconteceu.');
    if (!SEVERITIES.includes(values.severity)) errors.push('Selecione uma severidade válida.');
    if (!values.assignee) errors.push('Informe a pessoa responsável.');

    if (errors.length) {
      return response.status(422).render('incident-form', { severities: SEVERITIES, values, errors });
    }

    const incident = createIncident(db, values);
    return response.redirect(`/incidents/${incident.id}?created=1`);
  });

  app.get('/incidents/:id', (request, response) => {
    const incident = findIncidentById(db, request.params.id);
    if (!incident) return response.status(404).render('not-found');

    return response.render('incident-detail', {
      incident,
      history: getIncidentHistory(db, incident.id),
      statuses: STATUSES,
      error: null,
      created: request.query.created === '1',
      updated: request.query.updated === '1'
    });
  });

  app.post('/incidents/:id/status', (request, response) => {
    const incident = findIncidentById(db, request.params.id);
    if (!incident) return response.status(404).render('not-found');

    const newStatus = request.body.status;
    try {
      updateIncidentStatus(db, incident.id, newStatus);
      return response.redirect(`/incidents/${incident.id}?updated=1`);
    } catch (error) {
      return response.status(error.statusCode || 400).render('incident-detail', {
        incident,
        history: getIncidentHistory(db, incident.id),
        statuses: STATUSES,
        error: error.message,
        created: false,
        updated: false
      });
    }
  });

  return app;
}

module.exports = { createApp };
