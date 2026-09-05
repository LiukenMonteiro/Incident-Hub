const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];

function createDatabase(databasePath) {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
      assignee TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incident_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

function createIncident(db, incident) {
  const result = db.prepare(`
    INSERT INTO incidents (title, description, severity, assignee, status)
    VALUES (@title, @description, @severity, @assignee, 'Open')
  `).run(incident);

  const identifier = `INC-${String(result.lastInsertRowid).padStart(4, '0')}`;
  db.prepare('UPDATE incidents SET identifier = ? WHERE id = ?').run(identifier, result.lastInsertRowid);

  return findIncidentById(db, result.lastInsertRowid);
}

function updateIncidentStatus(db, id, newStatus) {
  if (!STATUSES.includes(newStatus)) {
    const error = new Error('Status informado é inválido.');
    error.statusCode = 422;
    throw error;
  }

  const incident = findIncidentById(db, id);
  if (!incident) {
    const error = new Error('Incidente não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (incident.status === newStatus) {
    return incident;
  }

  // Regra de negócio: Um incidente Critical não pode passar diretamente de Open para Resolved.
  if (incident.severity === 'Critical' && incident.status === 'Open' && newStatus === 'Resolved') {
    const error = new Error('Um incidente Critical não pode passar diretamente de Open para Resolved. Mova primeiro para In Progress.');
    error.statusCode = 422;
    throw error;
  }

  const update = db.transaction(() => {
    db.prepare(`
      UPDATE incidents
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, id);

    db.prepare(`
      INSERT INTO incident_history (incident_id, from_status, to_status, changed_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, incident.status, newStatus);
  });

  update();
  return findIncidentById(db, id);
}

function getIncidentHistory(db, incidentId) {
  return db.prepare(`
    SELECT * FROM incident_history
    WHERE incident_id = ?
    ORDER BY id ASC
  `).all(incidentId);
}

function findIncidentById(db, id) {
  return db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
}

function listIncidents(db, filters = {}) {
  const conditions = [];
  const parameters = [];

  if (filters.status) {
    conditions.push('status = ?');
    parameters.push(filters.status);
  }

  if (filters.severity) {
    conditions.push('severity = ?');
    parameters.push(filters.severity);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.prepare(`SELECT * FROM incidents ${where} ORDER BY datetime(updated_at) DESC, id DESC`).all(...parameters);
}

function incidentSummary(db) {
  const counts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open,
      SUM(CASE WHEN severity = 'Critical' AND status != 'Resolved' THEN 1 ELSE 0 END) AS critical_unresolved,
      SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
    FROM incidents
  `).get();

  return {
    total: counts.total || 0,
    open: counts.open || 0,
    criticalUnresolved: counts.critical_unresolved || 0,
    resolved: counts.resolved || 0
  };
}

const INITIAL_INCIDENTS = [
  {
    title: 'Payment API instability',
    description: 'Instabilidade identificada na comunicação com o gateway de pagamentos.',
    severity: 'Critical',
    assignee: 'Ana',
    status: 'Open'
  },
  {
    title: 'Reconciliation delay',
    description: 'Atraso na conciliação bancária diária devido a lentidão na fila de processamento.',
    severity: 'High',
    assignee: 'Bruno',
    status: 'In Progress'
  },
  {
    title: 'Incorrect customer notification',
    description: 'Notificações incorretas foram enviadas para clientes sobre renovação antecipada.',
    severity: 'Medium',
    assignee: 'Carla',
    status: 'Resolved'
  }
];

function seedInitialData(db) {
  const count = db.prepare('SELECT COUNT(*) AS count FROM incidents').get().count;
  if (count > 0) return false;

  const insert = db.transaction(() => {
    for (const data of INITIAL_INCIDENTS) {
      const result = db.prepare(`
        INSERT INTO incidents (title, description, severity, assignee, status)
        VALUES (@title, @description, @severity, @assignee, @status)
      `).run(data);

      const identifier = `INC-${String(result.lastInsertRowid).padStart(4, '0')}`;
      db.prepare('UPDATE incidents SET identifier = ? WHERE id = ?').run(identifier, result.lastInsertRowid);
    }
  });

  insert();
  return true;
}

module.exports = {
  SEVERITIES,
  STATUSES,
  createDatabase,
  createIncident,
  findIncidentById,
  getIncidentHistory,
  incidentSummary,
  listIncidents,
  seedInitialData,
  updateIncidentStatus
};
