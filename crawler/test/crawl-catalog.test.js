import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  CATEGORY_ORDER,
  crawlCatalogShop,
} from '../lib/crawl-catalog.js';

function product(shopId, categoryId, productId) {
  return {
    source: {
      shopId,
      sourceProductId: productId,
      productUrl: `https://shop.example/product/detail.html?product_no=${productId}`,
    },
    category: categoryId,
    reviews: [],
  };
}

function shopConfig(id = 'graychic') {
  return {
    id,
    categories: CATEGORY_ORDER.map((categoryId) => ({
      id: categoryId,
      url: `https://shop.example/${categoryId}`,
    })),
  };
}

test('preserves existing pants and claims later categories in fixed order', async () => {
  const rawDataDirectory = await mkdtemp(path.join(os.tmpdir(), 'levit-catalog-'));

  try {
    const pants = Array.from({ length: 20 }, (_, index) =>
      product('graychic', 'pants', `${index + 1}`),
    );
    await writeFile(
      path.join(rawDataDirectory, 'graychic-pants.json'),
      JSON.stringify(pants),
      'utf8',
    );
    const calls = [];
    let nextId = 21;

    const collections = await crawlCatalogShop({
      shopConfig: shopConfig(),
      rawDataDirectory,
      productLimit: 2,
      requestDelayMs: 0,
      productCrawler: async ({ categoryConfig, limit, excludedProductIds }) => {
        calls.push({
          categoryId: categoryConfig.id,
          excludedProductCount: excludedProductIds.size,
        });
        return Array.from({ length: limit }, () =>
          product('graychic', categoryConfig.id, `${nextId++}`),
        );
      },
      reviewCrawler: async ({ products }) => ({ products, failures: [] }),
    });

    assert.deepEqual(
      collections.map(({ categoryId, action, productCount }) => ({
        categoryId,
        action,
        productCount,
      })),
      [
        { categoryId: 'pants', action: 'preserved', productCount: 20 },
        { categoryId: 'top', action: 'crawled', productCount: 2 },
        { categoryId: 'dress', action: 'crawled', productCount: 2 },
        { categoryId: 'skirt', action: 'crawled', productCount: 2 },
        { categoryId: 'outerwear', action: 'crawled', productCount: 2 },
      ],
    );
    assert.deepEqual(calls, [
      { categoryId: 'top', excludedProductCount: 20 },
      { categoryId: 'dress', excludedProductCount: 22 },
      { categoryId: 'skirt', excludedProductCount: 24 },
      { categoryId: 'outerwear', excludedProductCount: 26 },
    ]);

    const outerwear = JSON.parse(
      await readFile(
        path.join(rawDataDirectory, 'graychic-outerwear.json'),
        'utf8',
      ),
    );
    assert.equal(outerwear.length, 2);
  } finally {
    await rm(rawDataDirectory, { recursive: true, force: true });
  }
});

test('does not publish a category file when review crawling fails', async () => {
  const rawDataDirectory = await mkdtemp(path.join(os.tmpdir(), 'levit-catalog-'));
  const config = shopConfig('fixture');

  try {
    await assert.rejects(
      crawlCatalogShop({
        shopConfig: config,
        rawDataDirectory,
        productLimit: 1,
        requestDelayMs: 0,
        preservedCategoryCounts: new Map(),
        productCrawler: async ({ categoryConfig }) => [
          product('fixture', categoryConfig.id, '101'),
        ],
        reviewCrawler: async ({ products }) => ({
          products,
          failures: [{ productId: '101', message: 'HTTP 500' }],
        }),
      }),
      /Review crawl failed/u,
    );

    await assert.rejects(
      readFile(path.join(rawDataDirectory, 'fixture-pants.json'), 'utf8'),
      /ENOENT/u,
    );
  } finally {
    await rm(rawDataDirectory, { recursive: true, force: true });
  }
});
