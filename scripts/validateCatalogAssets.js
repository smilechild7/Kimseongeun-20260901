import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const RAW_DATA_DIRECTORY = new URL('../data/raw/', import.meta.url);
const USER_AGENT =
  'LevitProblemSolverValidator/0.1 (+https://levit-problem-solver.onrender.com; educational MVP)';

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

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function loadProducts() {
  const fileNames = (await readdir(RAW_DATA_DIRECTORY))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
  const collections = await Promise.all(
    fileNames.map(async (fileName) =>
      JSON.parse(await readFile(new URL(fileName, RAW_DATA_DIRECTORY), 'utf8')),
    ),
  );
  const products = collections.flat();

  // Round-robin shops so concurrent workers do not burst against one storefront.
  return products.sort((left, right) => {
    const leftId = `${left.source.sourceProductId}:${left.source.shopId}`;
    const rightId = `${right.source.sourceProductId}:${right.source.shopId}`;
    return leftId.localeCompare(rightId);
  });
}

async function inspectUrl(url, expectedContentType) {
  let lastFailure;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT },
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });
      const contentType = response.headers.get('content-type') ?? '';
      await response.body?.cancel();
      const result = {
        ok:
          response.ok &&
          response.url.startsWith('https://') &&
          contentType.toLowerCase().includes(expectedContentType),
        status: response.status,
        contentType,
        finalUrl: response.url,
      };

      if (result.ok) {
        return result;
      }

      lastFailure = result;
    } catch (error) {
      lastFailure = {
        ok: false,
        status: null,
        contentType: null,
        finalUrl: null,
        error: error.name,
      };
    }

    await wait(500);
  }

  return lastFailure;
}

async function validateProduct(product) {
  const page = await inspectUrl(product.source.productUrl, 'text/html');
  const image = await inspectUrl(product.imageUrl, 'image/');

  return {
    productId: `${product.source.shopId}:${product.source.sourceProductId}`,
    productUrl: product.source.productUrl,
    imageUrl: product.imageUrl,
    page,
    image,
  };
}

async function concurrentMap(values, concurrency, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
      completed += 1;

      if (completed % 25 === 0 || completed === values.length) {
        console.log(
          JSON.stringify({
            event: 'catalog.validation.progress',
            completed,
            total: values.length,
          }),
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker()),
  );
  return results;
}

async function main() {
  const concurrency = positiveInteger(argumentValue('concurrency'), 10);
  const products = await loadProducts();
  const results = await concurrentMap(products, concurrency, validateProduct);
  const failures = results.filter(({ page, image }) => !page.ok || !image.ok);

  console.log(
    JSON.stringify({
      event: 'catalog.validation.complete',
      products: products.length,
      productPagesPassed: results.filter(({ page }) => page.ok).length,
      imagesPassed: results.filter(({ image }) => image.ok).length,
      failureCount: failures.length,
      failures,
    }),
  );
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'catalog.validation.failed',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
      cwd: path.resolve('.'),
    }),
  );
  process.exitCode = 1;
});
