import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { openDatabase } from '../server/db/connection.js';
import { buildDatabase } from './buildDatabase.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

test('rebuilds a deterministic database from committed raw JSON', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'levit-db-build-'));
  const databasePath = path.join(temporaryDirectory, 'products.db');
  const buildOptions = {
    databasePath,
    rawDataDirectory: path.join(repositoryRoot, 'data/raw'),
    migrationsDirectory: path.join(repositoryRoot, 'db/migrations'),
  };

  try {
    const firstBuild = await buildDatabase(buildOptions);
    const secondBuild = await buildDatabase(buildOptions);

    assert.deepEqual(firstBuild.counts, {
      shops: 2,
      products: 40,
      reviews: 406,
      enrichments: 0,
    });
    assert.deepEqual(secondBuild.counts, firstBuild.counts);

    const database = openDatabase(databasePath, {
      readonly: true,
      fileMustExist: true,
    });

    try {
      assert.deepEqual(
        database
          .prepare(`
            SELECT products.id, COUNT(reviews.id) review_count
            FROM products
            JOIN reviews ON reviews.product_id = products.id
            WHERE products.id = ?
            GROUP BY products.id
          `)
          .get('graychic:11284'),
        { id: 'graychic:11284', review_count: 20 },
      );
    } finally {
      database.close();
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
