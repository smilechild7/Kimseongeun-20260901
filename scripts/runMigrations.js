import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { openDatabase } from '../server/db/connection.js';
import { runMigrations } from '../server/db/migrationRunner.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const databasePath = path.join(repositoryRoot, 'data/products.db');
const migrationsDirectory = path.join(repositoryRoot, 'db/migrations');
const database = openDatabase(databasePath);

try {
  const migrations = await runMigrations(database, migrationsDirectory);
  console.log(
    JSON.stringify({
      event: 'db.migrate.complete',
      applied: migrations,
    }),
  );
} finally {
  database.close();
}
