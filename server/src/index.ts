import 'dotenv/config';

import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const { app, close } = createApp({
  databasePath: config.DATABASE_PATH,
  jwtSecret: config.JWT_SECRET,
  corsOrigin: config.CORS_ORIGIN,
});

const server = app.listen(config.PORT, () => {
  console.log(`Kaquiz API listening on port ${config.PORT}`);
});

function shutdown() {
  server.close(() => {
    close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
