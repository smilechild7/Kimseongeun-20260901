import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MIGRATION_FILE_PATTERN = /^\d+_[a-z0-9_-]+\.sql$/i;

function ensureMigrationTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
}

export async function runMigrations(database, migrationsDirectory) {
  ensureMigrationTable(database);

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => MIGRATION_FILE_PATTERN.test(fileName))
    .sort((left, right) => left.localeCompare(right));
  const appliedVersions = new Set(
    database
      .prepare('SELECT version FROM schema_migrations ORDER BY version')
      .all()
      .map((row) => row.version),
  );
  const recordMigration = database.prepare(`
    INSERT INTO schema_migrations (version, applied_at)
    VALUES (?, ?)
  `);
  const applied = [];

  for (const fileName of migrationFiles) {
    if (appliedVersions.has(fileName)) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDirectory, fileName), 'utf8');
    const applyMigration = database.transaction(() => {
      database.exec(sql);
      recordMigration.run(fileName, new Date().toISOString());
    });

    applyMigration();
    applied.push(fileName);
  }

  return applied;
}
