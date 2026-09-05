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
      SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN severity IN ('High', 'Critical') AND status != 'Resolved' THEN 1 ELSE 0 END) AS needs_attention
    FROM incidents
  `).get();

  return {
    total: counts.total || 0,
    open: counts.open || 0,
    inProgress: counts.in_progress || 0,
    needsAttention: counts.needs_attention || 0
  };
}

module.exports = {
  SEVERITIES,
  STATUSES,
  createDatabase,
  createIncident,
  findIncidentById,
  incidentSummary,
  listIncidents
};
