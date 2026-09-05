const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('./app');
const { createDatabase, seedInitialData } = require('./db');

const port = Number(process.env.PORT || 3000);
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'incident-hub.db');

function ensurePersistentDatabasePath() {
  if (process.env.REQUIRE_PERSISTENT_DATABASE !== 'true') return;

  const dataDirectory = path.dirname(databasePath);
  if (!fs.existsSync(dataDirectory)) {
    throw new Error(`Persistência obrigatória: crie um volume Railway montado em ${dataDirectory}.`);
  }

  const directoryStats = fs.statSync(dataDirectory);
  const parentStats = fs.statSync(path.dirname(dataDirectory));
  if (directoryStats.dev === parentStats.dev) {
    throw new Error(`Persistência obrigatória: ${dataDirectory} existe, mas não está montado como volume.`);
  }
}

ensurePersistentDatabasePath();
console.log(`SQLite persistente em ${databasePath}`);
const db = createDatabase(databasePath);
seedInitialData(db);
const app = createApp(db);

app.listen(port, () => {
  console.log(`Incident Hub disponível em http://localhost:${port}`);
});
