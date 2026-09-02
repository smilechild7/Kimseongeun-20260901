import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
      productIds: ['a:1', 'b:2'],
    },
  );
  assert.throws(() => parseArguments(['--limit=0']), /positive integer/u);
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/u);
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
