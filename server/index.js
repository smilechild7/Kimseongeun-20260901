import { createApp } from './app.js';
import { createRuntimeServices } from './runtime.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const runtime = createRuntimeServices();
const app = createApp({ chat: runtime.chat });

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[server] listening port=${port}`);
});

server.on('error', (error) => {
  console.error(`[server] failed code=${error.code ?? 'unknown'}`);
  process.exitCode = 1;
});

function shutdown() {
  server.close(() => {
    runtime.close();
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
