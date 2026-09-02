import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { openDatabase } from './connection.js';
import { runMigrations } from './migrationRunner.js';

const migrationsDirectory = fileURLToPath(
  new URL('../../db/migrations', import.meta.url),
);

test('applies each migration once and records its version', async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), 'levit-migrations-'),
  );
  const database = openDatabase(path.join(temporaryDirectory, 'products.db'));

  try {
    assert.deepEqual(await runMigrations(database, migrationsDirectory), [
      '001_initial.sql',
    ]);
    assert.deepEqual(await runMigrations(database, migrationsDirectory), []);
    assert.deepEqual(
      database.prepare('SELECT version FROM schema_migrations').all(),
      [{ version: '001_initial.sql' }],
    );
    assert.ok(
      database
        .prepare("SELECT name FROM sqlite_master WHERE name = 'products'")
        .get(),
    );
  } finally {
    database.close();
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('rolls back a failed migration without recording it', async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), 'levit-migration-rollback-'),
  );
  const database = openDatabase(path.join(temporaryDirectory, 'products.db'));

  try {
    await writeFile(
      path.join(temporaryDirectory, '001_valid.sql'),
      'CREATE TABLE valid_table (id INTEGER PRIMARY KEY);',
      'utf8',
    );
    await writeFile(
      path.join(temporaryDirectory, '002_invalid.sql'),
      'CREATE TABLE should_rollback (id INTEGER); INVALID SQL;',
      'utf8',
    );

    await assert.rejects(
      runMigrations(database, temporaryDirectory),
      /near "INVALID": syntax error/u,
    );
    assert.deepEqual(
      database.prepare('SELECT version FROM schema_migrations').all(),
      [{ version: '001_valid.sql' }],
    );
    assert.equal(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE name = 'should_rollback'",
        )
        .get(),
      undefined,
    );
  } finally {
    database.close();
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
