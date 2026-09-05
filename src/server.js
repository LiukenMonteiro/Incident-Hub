const path = require('node:path');
const { createApp } = require('./app');
const { createDatabase } = require('./db');

const port = Number(process.env.PORT || 3000);
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'incident-hub.db');
const db = createDatabase(databasePath);
const app = createApp(db);

app.listen(port, () => {
  console.log(`Incident Hub disponível em http://localhost:${port}`);
});
