import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { openDatabase } from '../server/db/connection.js';
import { runMigrations } from '../server/db/migrationRunner.js';
import { createProductRepository } from '../server/products/productRepository.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

async function readRawProducts(rawDataDirectory) {
  const fileNames = (await readdir(rawDataDirectory))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));
  const products = [];

  for (const fileName of fileNames) {
    const value = JSON.parse(
      await readFile(path.join(rawDataDirectory, fileName), 'utf8'),
    );

    if (!Array.isArray(value)) {
      throw new Error(`Expected an array in raw data file: ${fileName}`);
    }

    products.push(...value);
  }

  return products;
}

function databaseCounts(database) {
  return {
    shops: database.prepare('SELECT COUNT(*) count FROM shops').get().count,
    products: database.prepare('SELECT COUNT(*) count FROM products').get().count,
    reviews: database.prepare('SELECT COUNT(*) count FROM reviews').get().count,
    enrichments: database
      .prepare('SELECT COUNT(*) count FROM product_enrichments')
      .get().count,
  };
}

export async function buildDatabase({
  databasePath = path.join(repositoryRoot, 'data/products.db'),
  rawDataDirectory = path.join(repositoryRoot, 'data/raw'),
  migrationsDirectory = path.join(repositoryRoot, 'db/migrations'),
} = {}) {
  const products = await readRawProducts(rawDataDirectory);
  const expectedReviewCount = products.reduce(
    (total, product) => total + (product.reviews?.length ?? 0),
    0,
  );

  await mkdir(path.dirname(databasePath), { recursive: true });
  await rm(databasePath, { force: true });

  const database = openDatabase(databasePath);

  try {
    const migrations = await runMigrations(database, migrationsDirectory);
    const productRepository = createProductRepository(database);
    productRepository.saveProducts(products);

    const counts = databaseCounts(database);

    if (
      counts.products !== products.length ||
      counts.reviews !== expectedReviewCount
    ) {
      throw new Error(
        `Database count mismatch: expected products=${products.length} reviews=${expectedReviewCount}, actual products=${counts.products} reviews=${counts.reviews}`,
      );
    }

    return { databasePath, migrations, counts };
  } finally {
    database.close();
  }
}

async function main() {
  const result = await buildDatabase();

  console.log(
    JSON.stringify({
      event: 'db.build.complete',
      databasePath: path.relative(repositoryRoot, result.databasePath),
      migrations: result.migrations,
      counts: result.counts,
    }),
  );
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: 'db.build.failed',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  });
}
