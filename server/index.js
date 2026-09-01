import { createApp } from './app.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const app = createApp();

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[server] listening port=${port}`);
});

server.on('error', (error) => {
  console.error(`[server] failed code=${error.code ?? 'unknown'}`);
  process.exitCode = 1;
});
