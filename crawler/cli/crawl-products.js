import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getCategoryConfig, getShopConfig, SHOPS } from '../config/shops.js';
import { crawlShop } from '../lib/crawl-shop.js';

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
  const limit = positiveInteger(argumentValue('limit'), 10);
  const requestDelayMs = positiveInteger(argumentValue('delay-ms'), 1_000);
  const shopIds = requestedShop ? [requestedShop] : Object.keys(SHOPS);
  const rawDataDirectory = path.resolve('data/raw');

  await mkdir(rawDataDirectory, { recursive: true });

  for (const shopId of shopIds) {
    const shopConfig = getShopConfig(shopId);
    const categoryConfig = getCategoryConfig(shopConfig, categoryId);

    console.log(
      JSON.stringify({
        event: 'crawler.shop.start',
        shopId,
        category: categoryId,
        limit,
      }),
    );

    const products = await crawlShop({
      shopConfig,
      categoryConfig,
      limit,
      requestDelayMs,
    });
    const outputPath = path.join(rawDataDirectory, `${shopId}-${categoryId}.json`);

    await writeFile(outputPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8');

    console.log(
      JSON.stringify({
        event: 'crawler.shop.complete',
        shopId,
        category: categoryId,
        productCount: products.length,
        outputPath,
      }),
    );
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'crawler.failed',
      message: error.message,
    }),
  );
  process.exitCode = 1;
});
