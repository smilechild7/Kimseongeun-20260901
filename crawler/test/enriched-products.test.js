import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { validateEnrichmentOutput } from '../pipeline/enrichmentContract.js';
import { ENRICHMENT_OVERRIDES } from '../pipeline/enrichmentOverrides.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

async function readArrays(directory) {
  const values = [];
  for (const fileName of (await readdir(directory)).filter((name) => name.endsWith('.json'))) {
    const parsed = JSON.parse(await readFile(path.join(directory, fileName), 'utf8'));
    assert.equal(Array.isArray(parsed), true, `${fileName} must contain an array`);
    values.push(...parsed);
  }
  return values;
}

test('committed enrichments match raw products and the evidence contract', async () => {
  const rawProducts = await readArrays(path.join(repositoryRoot, 'data/raw'));
  const rawProductsById = new Map(
    rawProducts.map((product) => [
      `${product.source.shopId}:${product.source.sourceProductId}`,
      product,
    ]),
  );
  const enrichments = await readArrays(path.join(repositoryRoot, 'data/enriched'));
  const productIds = new Set();

  assert.equal(enrichments.length > 0, true);
  for (const enrichment of enrichments) {
    const { productId, model, promptVersion, enrichedAt, ...output } = enrichment;
    assert.equal(productIds.has(productId), false, `duplicate enrichment: ${productId}`);
    productIds.add(productId);
    assert.equal(rawProductsById.has(productId), true, `missing raw product: ${productId}`);
    assert.equal(model, 'gpt-5.6-luna');
    assert.equal(['v1', 'v2'].includes(promptVersion), true);
    assert.equal(Number.isNaN(Date.parse(enrichedAt)), false);
    validateEnrichmentOutput(output, rawProductsById.get(productId));
  }

  for (const [productId, override] of Object.entries(ENRICHMENT_OVERRIDES)) {
    const enrichment = enrichments.find((value) => value.productId === productId);
    assert.deepEqual(
      enrichment.reviewSummary.appearanceMatch,
      override.appearanceMatch,
    );
  }
});
