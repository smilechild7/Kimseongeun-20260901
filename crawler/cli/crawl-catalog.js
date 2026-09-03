import path from 'node:path';

import { getShopConfig, SHOPS } from '../config/shops.js';
import { crawlCatalog } from '../lib/crawl-catalog.js';

function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  if (inline) {
    return inline.slice(name.length + 3);
  }

  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

function positiveInteger(value, fallback) {
  if (value === null) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received: ${value}`);
  }

  return parsed;
}

async function main() {
  const requestedShop = argumentValue('shop');
  const productLimit = positiveInteger(argumentValue('product-limit'), 10);
  const reviewLimit = positiveInteger(argumentValue('review-limit'), 20);
  const requestDelayMs = positiveInteger(argumentValue('delay-ms'), 1_000);
  const resume = process.argv.includes('--resume');
  const shopConfigs = requestedShop
    ? [getShopConfig(requestedShop)]
    : Object.values(SHOPS);
  const rawDataDirectory = path.resolve('data/raw');

  console.log(
    JSON.stringify({
      event: 'crawler.catalog.start',
      shopCount: shopConfigs.length,
      productLimit,
      reviewLimit,
      requestDelayMs,
      resume,
    }),
  );

  const collections = await crawlCatalog({
    shopConfigs,
    rawDataDirectory,
    productLimit,
    reviewLimit,
    requestDelayMs,
    resume,
  });

  console.log(
    JSON.stringify({
      event: 'crawler.catalog.complete',
      collectionCount: collections.length,
      productCount: collections.reduce(
        (total, collection) => total + collection.productCount,
        0,
      ),
      crawledCount: collections.filter(({ action }) => action === 'crawled').length,
      preservedCount: collections.filter(({ action }) => action === 'preserved')
        .length,
      resumedCount: collections.filter(({ action }) => action === 'resumed').length,
    }),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'crawler.catalog.failed',
      message: error.message,
    }),
  );
  process.exitCode = 1;
});
