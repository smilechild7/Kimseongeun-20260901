import { discoverProductUrls } from './discover-product-urls.js';
import { fetchPage, wait } from './fetch-page.js';
import { parseCafe24Product } from './parse-cafe24-product.js';

export async function crawlShop({
  shopConfig,
  categoryConfig,
  limit = 10,
  requestDelayMs = 1_000,
  fetcher = fetchPage,
}) {
  const categoryHtml = await fetcher(categoryConfig.url);
  const productUrls = discoverProductUrls(categoryHtml, shopConfig, limit);

  if (productUrls.length < limit) {
    throw new Error(
      `Only discovered ${productUrls.length}/${limit} products for ${shopConfig.id}:${categoryConfig.id}`,
    );
  }

  const products = [];

  for (const [index, productUrl] of productUrls.entries()) {
    await wait(requestDelayMs);
    const html = await fetcher(productUrl);
    const product = parseCafe24Product(html, {
      shopConfig,
      categoryConfig,
      productUrl,
    });
    products.push(product);

    console.log(
      JSON.stringify({
        event: 'crawler.product.complete',
        shopId: shopConfig.id,
        category: categoryConfig.id,
        productId: product.source.sourceProductId,
        progress: `${index + 1}/${productUrls.length}`,
      }),
    );
  }

  return products;
}
