import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getShopConfig, SHOPS } from '../config/shops.js';
import { crawlReviews } from '../lib/crawl-reviews.js';

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
  const categoryId = argumentValue('category') ?? 'pants';
  const productLimit = positiveInteger(argumentValue('product-limit'), 20);
  const reviewLimit = positiveInteger(argumentValue('review-limit'), 20);
  const requestDelayMs = positiveInteger(argumentValue('delay-ms'), 1_000);
  const shopIds = requestedShop ? [requestedShop] : Object.keys(SHOPS);
  const rawDataDirectory = path.resolve('data/raw');

  for (const shopId of shopIds) {
    const shopConfig = getShopConfig(shopId);
    const outputPath = path.join(rawDataDirectory, `${shopId}-${categoryId}.json`);
    const products = JSON.parse(await readFile(outputPath, 'utf8'));

    console.log(
      JSON.stringify({
        event: 'crawler.reviews.shop.start',
        shopId,
        category: categoryId,
        productLimit,
        reviewLimit,
      }),
    );

    const result = await crawlReviews({
      products,
      shopConfig,
      productLimit,
      reviewLimit,
      requestDelayMs,
    });

    await writeFile(outputPath, `${JSON.stringify(result.products, null, 2)}\n`, 'utf8');

    console.log(
      JSON.stringify({
        event: 'crawler.reviews.shop.complete',
        shopId,
        category: categoryId,
        productCount: result.products.length,
        failureCount: result.failures.length,
        outputPath,
      }),
    );
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'crawler.reviews.failed',
      message: error.message,
    }),
  );
  process.exitCode = 1;
});
