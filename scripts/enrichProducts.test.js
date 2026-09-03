import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  SAMPLE_PRODUCT_IDS,
  parseArguments,
  runEnrichment,
} from './enrichProducts.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

test('parses CLI filters and rejects invalid arguments', () => {
  assert.deepEqual(
    parseArguments(['--dry-run', '--limit=5', '--product-ids=a:1,b:2']),
    {
      dryRun: true,
      limit: 5,
      missingOnly: false,
      outputPath: null,
      productIds: ['a:1', 'b:2'],
      seedPaths: [],
    },
  );
  assert.throws(() => parseArguments(['--limit=0']), /positive integer/u);
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/u);
  assert.equal(parseArguments(['--output=result.preview']).outputPath, 'result.preview');
  assert.deepEqual(
    parseArguments(['--missing-only', '--seed=sample.preview']).seedPaths,
    ['sample.preview'],
  );
});

test('dry-runs the fixed five-product sample without an API client', async () => {
  const result = await runEnrichment({
    options: {
      dryRun: true,
      limit: null,
      productIds: SAMPLE_PRODUCT_IDS,
    },
    client: null,
    rawDataDirectory: path.join(repositoryRoot, 'data/raw'),
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.logicalApiCalls, 5);
  assert.equal(result.savedReviews, 74);
  assert.deepEqual(result.selectedProductIds, SAMPLE_PRODUCT_IDS);
});

test('writes only after every selected product is enriched successfully', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'levit-enrich-'));
  const outputPath = path.join(temporaryDirectory, 'products.json');
  const checkpointPath = `${outputPath}.checkpoint`;
  const options = { dryRun: false, limit: 2, productIds: null };

  try {
    const result = await runEnrichment({
      options,
      client: {},
      rawDataDirectory: path.join(repositoryRoot, 'data/raw'),
      outputPath,
      checkpointPath,
      enrich: async ({ product }) => ({
        productId: `${product.source.shopId}:${product.source.sourceProductId}`,
      }),
    });

    assert.equal(result.written, 2);
    assert.deepEqual(result.usage, {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });
    assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).length, 2);

    await writeFile(outputPath, '["preserved"]\n', 'utf8');
    let callCount = 0;
    await assert.rejects(
      runEnrichment({
        options,
        client: {},
        rawDataDirectory: path.join(repositoryRoot, 'data/raw'),
        outputPath,
        checkpointPath,
        enrich: async ({ product }) => {
          callCount += 1;
          if (callCount === 2) {
            throw new Error('mock failure');
          }
          return {
            productId: `${product.source.shopId}:${product.source.sourceProductId}`,
          };
        },
      }),
      /mock failure/u,
    );
    assert.equal(await readFile(outputPath, 'utf8'), '["preserved"]\n');

    callCount = 0;
    const resumed = await runEnrichment({
      options,
      client: {},
      rawDataDirectory: path.join(repositoryRoot, 'data/raw'),
      outputPath,
      checkpointPath,
      enrich: async ({ product }) => {
        callCount += 1;
        return {
          productId: `${product.source.shopId}:${product.source.sourceProductId}`,
        };
      },
    });
    assert.equal(callCount, 1);
    assert.equal(resumed.written, 2);
    await assert.rejects(readFile(checkpointPath, 'utf8'), /ENOENT/u);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('preserves existing and seeded enrichments while calling only missing products', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'levit-enrich-merge-'));
  const rawDataDirectory = path.join(temporaryDirectory, 'raw');
  const outputPath = path.join(temporaryDirectory, 'products.json');
  const seedPath = path.join(temporaryDirectory, 'sample.preview');

  try {
    await mkdir(rawDataDirectory, { recursive: true });
    const products = ['1', '2', '3'].map((sourceProductId) => ({
      source: { shopId: 'shop', sourceProductId },
      reviews: [],
    }));
    await writeFile(
      path.join(rawDataDirectory, 'shop-pants.json'),
      JSON.stringify(products),
      'utf8',
    );
    await writeFile(outputPath, JSON.stringify([{ productId: 'shop:1' }]), 'utf8');
    await writeFile(seedPath, JSON.stringify([{ productId: 'shop:2' }]), 'utf8');
    const calledProductIds = [];

    const result = await runEnrichment({
      options: {
        dryRun: false,
        limit: null,
        missingOnly: true,
        productIds: null,
        seedPaths: [seedPath],
      },
      client: {},
      rawDataDirectory,
      outputPath,
      seedPaths: [seedPath],
      enrich: async ({ product }) => {
        const id = `shop:${product.source.sourceProductId}`;
        calledProductIds.push(id);
        return { productId: id };
      },
    });

    assert.deepEqual(calledProductIds, ['shop:3']);
    assert.equal(result.logicalApiCalls, 1);
    assert.equal(result.preserved, 2);
    assert.equal(result.written, 3);
    assert.deepEqual(
      JSON.parse(await readFile(outputPath, 'utf8')).map(({ productId }) => productId),
      ['shop:1', 'shop:2', 'shop:3'],
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
