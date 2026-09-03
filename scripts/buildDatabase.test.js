import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
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

async function committedEnrichmentCount() {
  const directory = path.join(repositoryRoot, 'data/enriched');
  let fileNames;
  try {
    fileNames = await readdir(directory);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }

  let count = 0;
  for (const fileName of fileNames.filter((name) => name.endsWith('.json'))) {
    count += JSON.parse(await readFile(path.join(directory, fileName), 'utf8')).length;
  }
  return count;
}

async function committedRawCounts() {
  const directory = path.join(repositoryRoot, 'data/raw');
  const fileNames = (await readdir(directory)).filter((name) =>
    name.endsWith('.json'),
  );
  const products = [];

  for (const fileName of fileNames) {
    products.push(
      ...JSON.parse(await readFile(path.join(directory, fileName), 'utf8')),
    );
  }

  return {
    shops: new Set(products.map((product) => product.source.shopId)).size,
    products: products.length,
    reviews: products.reduce(
      (total, product) => total + product.reviews.length,
      0,
    ),
  };
}

test('rebuilds a deterministic database from committed raw JSON', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'levit-db-build-'));
  const databasePath = path.join(temporaryDirectory, 'products.db');
  const buildOptions = {
    databasePath,
    rawDataDirectory: path.join(repositoryRoot, 'data/raw'),
    migrationsDirectory: path.join(repositoryRoot, 'db/migrations'),
  };

  try {
    const enrichments = await committedEnrichmentCount();
    const rawCounts = await committedRawCounts();
    const firstBuild = await buildDatabase(buildOptions);
    const secondBuild = await buildDatabase(buildOptions);

    assert.deepEqual(firstBuild.counts, {
      ...rawCounts,
      enrichments,
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
