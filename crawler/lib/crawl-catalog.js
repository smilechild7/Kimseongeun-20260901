import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { crawlReviews } from './crawl-reviews.js';
import { crawlShop } from './crawl-shop.js';

export const CATEGORY_ORDER = [
  'pants',
  'top',
  'dress',
  'skirt',
  'outerwear',
];

export const PRESERVED_CATEGORY_COUNTS = new Map([
  ['graychic:pants', 20],
  ['ifemme:pants', 20],
]);

function categoryKey(shopId, categoryId) {
  return `${shopId}:${categoryId}`;
}

function outputPathFor(rawDataDirectory, shopId, categoryId) {
  return path.join(rawDataDirectory, `${shopId}-${categoryId}.json`);
}

function validateCollection(products, { shopId, categoryId, expectedCount }) {
  if (!Array.isArray(products) || products.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} products for ${shopId}:${categoryId}, received ${Array.isArray(products) ? products.length : 'non-array'}`,
    );
  }

  const productIds = new Set();

  for (const product of products) {
    const productId = product?.source?.sourceProductId;

    if (
      product?.source?.shopId !== shopId ||
      product?.category !== categoryId ||
      typeof productId !== 'string' ||
      productId.length === 0
    ) {
      throw new Error(`Invalid product contract in ${shopId}:${categoryId}`);
    }

    if (productIds.has(productId)) {
      throw new Error(`Duplicate product ${shopId}:${productId} in ${categoryId}`);
    }

    if (!Array.isArray(product.reviews) || product.reviews.length > 20) {
      throw new Error(`Invalid review contract for ${shopId}:${productId}`);
    }

    productIds.add(productId);
  }

  return productIds;
}

async function readCollection(outputPath, contract) {
  const products = JSON.parse(await readFile(outputPath, 'utf8'));
  validateCollection(products, contract);
  return products;
}

async function atomicWriteJson(outputPath, value) {
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, outputPath);
}

function addClaimedProductIds(products, claimedProductIds, shopId, categoryId) {
  for (const product of products) {
    const productId = product.source.sourceProductId;

    if (claimedProductIds.has(productId)) {
      throw new Error(
        `Product ${shopId}:${productId} is assigned to multiple categories (latest: ${categoryId})`,
      );
    }

    claimedProductIds.add(productId);
  }
}

function assertUnclaimed(products, claimedProductIds, shopId, categoryId) {
  for (const product of products) {
    const productId = product.source.sourceProductId;

    if (claimedProductIds.has(productId)) {
      throw new Error(
        `Product ${shopId}:${productId} is assigned to multiple categories (latest: ${categoryId})`,
      );
    }
  }
}

export async function crawlCatalogShop({
  shopConfig,
  rawDataDirectory,
  productLimit = 10,
  reviewLimit = 20,
  requestDelayMs = 1_000,
  resume = false,
  preservedCategoryCounts = PRESERVED_CATEGORY_COUNTS,
  productCrawler = crawlShop,
  reviewCrawler = crawlReviews,
}) {
  const claimedProductIds = new Set();
  const collections = [];

  for (const categoryId of CATEGORY_ORDER) {
    const categoryConfig = shopConfig.categories.find(
      (candidate) => candidate.id === categoryId,
    );

    if (!categoryConfig) {
      throw new Error(`Missing category ${shopConfig.id}:${categoryId}`);
    }

    const outputPath = outputPathFor(
      rawDataDirectory,
      shopConfig.id,
      categoryId,
    );
    const preservedCount = preservedCategoryCounts.get(
      categoryKey(shopConfig.id, categoryId),
    );
    const expectedCount = preservedCount ?? productLimit;
    let products;
    let action = 'crawled';

    if (preservedCount !== undefined) {
      products = await readCollection(outputPath, {
        shopId: shopConfig.id,
        categoryId,
        expectedCount,
      });
      action = 'preserved';
    } else if (resume) {
      try {
        products = await readCollection(outputPath, {
          shopId: shopConfig.id,
          categoryId,
          expectedCount,
        });
        action = 'resumed';
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    if (!products) {
      console.log(
        JSON.stringify({
          event: 'crawler.catalog.category.start',
          shopId: shopConfig.id,
          category: categoryId,
          productLimit,
          excludedProductCount: claimedProductIds.size,
        }),
      );

      const crawledProducts = await productCrawler({
        shopConfig,
        categoryConfig,
        limit: productLimit,
        requestDelayMs,
        excludedProductIds: claimedProductIds,
      });
      const reviewResult = await reviewCrawler({
        products: crawledProducts,
        shopConfig,
        productLimit,
        reviewLimit,
        requestDelayMs,
      });

      if (reviewResult.failures.length > 0) {
        throw new Error(
          `Review crawl failed for ${shopConfig.id}:${categoryId}: ${reviewResult.failures.map(({ productId }) => productId).join(', ')}`,
        );
      }

      products = reviewResult.products;
      validateCollection(products, {
        shopId: shopConfig.id,
        categoryId,
        expectedCount,
      });
      assertUnclaimed(
        products,
        claimedProductIds,
        shopConfig.id,
        categoryId,
      );
      await atomicWriteJson(outputPath, products);
    }

    addClaimedProductIds(
      products,
      claimedProductIds,
      shopConfig.id,
      categoryId,
    );
    collections.push({
      shopId: shopConfig.id,
      categoryId,
      productCount: products.length,
      action,
      outputPath,
    });

    console.log(
      JSON.stringify({
        event: 'crawler.catalog.category.complete',
        shopId: shopConfig.id,
        category: categoryId,
        productCount: products.length,
        action,
        outputPath,
      }),
    );
  }

  return collections;
}

export async function crawlCatalog({
  shopConfigs,
  rawDataDirectory,
  productLimit = 10,
  reviewLimit = 20,
  requestDelayMs = 1_000,
  resume = false,
}) {
  await mkdir(rawDataDirectory, { recursive: true });

  const results = await Promise.allSettled(
    shopConfigs.map((shopConfig) =>
      crawlCatalogShop({
        shopConfig,
        rawDataDirectory,
        productLimit,
        reviewLimit,
        requestDelayMs,
        resume,
      }),
    ),
  );
  const failures = results.flatMap((result, index) =>
    result.status === 'rejected'
      ? [
          {
            shopId: shopConfigs[index].id,
            message: result.reason?.message ?? String(result.reason),
          },
        ]
      : [],
  );

  if (failures.length > 0) {
    throw new Error(
      `Catalog crawl failed for ${failures.map(({ shopId, message }) => `${shopId} (${message})`).join('; ')}`,
    );
  }

  return results.flatMap((result) => result.value);
}
