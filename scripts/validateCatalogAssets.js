import { readFile } from 'node:fs/promises';

const RAW_PRODUCT_FILES = [
  new URL('../data/raw/graychic-pants.json', import.meta.url),
  new URL('../data/raw/ifemme-pants.json', import.meta.url),
];
const USER_AGENT =
  'LevitProblemSolverValidator/0.1 (+https://levit-problem-solver.onrender.com; educational MVP)';

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function loadProducts() {
  const collections = await Promise.all(
    RAW_PRODUCT_FILES.map(async (url) => JSON.parse(await readFile(url, 'utf8'))),
  );
  return collections.flat();
}

async function inspectUrl(url, expectedContentType) {
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    const contentType = response.headers.get('content-type') ?? '';
    await response.body?.cancel();
    return {
      ok:
        response.ok &&
        response.url.startsWith('https://') &&
        contentType.toLowerCase().includes(expectedContentType),
      status: response.status,
      contentType,
      finalUrl: response.url,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      contentType: null,
      finalUrl: null,
      error: error.name,
    };
  }
}

async function main() {
  const products = await loadProducts();
  const results = [];

  for (const [index, product] of products.entries()) {
    const productUrl = product.source.productUrl;
    const page = await inspectUrl(productUrl, 'text/html');
    await wait(200);
    const image = await inspectUrl(product.imageUrl, 'image/');
    results.push({
      productId: `${product.source.shopId}:${product.source.sourceProductId}`,
      page,
      image,
    });
    console.log(
      JSON.stringify({
        event: 'catalog.validation.progress',
        current: index + 1,
        total: products.length,
        page: page.ok,
        image: image.ok,
      }),
    );
    await wait(200);
  }

  const failures = results.filter(({ page, image }) => !page.ok || !image.ok);
  console.log(
    JSON.stringify({
      event: 'catalog.validation.complete',
      products: products.length,
      productPagesPassed: results.filter(({ page }) => page.ok).length,
      imagesPassed: results.filter(({ image }) => image.ok).length,
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
    }),
  );
  process.exitCode = 1;
});
