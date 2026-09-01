import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRouter from './routes/health.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientBuildDirectory = path.resolve(currentDirectory, '../dist/client');
const clientEntry = path.join(clientBuildDirectory, 'index.html');

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/api/health', healthRouter);

  app.use('/api', (_request, response) => {
    response.status(404).json({
      error: 'not_found'
    });
  });

  if (existsSync(clientEntry)) {
    app.use(express.static(clientBuildDirectory));
    app.get(/.*/, (_request, response) => {
      response.sendFile(clientEntry);
    });
  }

  return app;
}
