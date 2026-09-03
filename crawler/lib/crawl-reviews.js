import { fetchPage, wait } from './fetch-page.js';
import { parseCafe24Reviews, parseCremaReviews } from './parse-reviews.js';

function cremaReviewsUrl(reviewConfig, productId, limit) {
  const url = new URL(
    `/api/${reviewConfig.brandCode}/reviews`,
    reviewConfig.apiBaseUrl,
  );

  url.searchParams.set('product_code', productId);
  url.searchParams.set('widget_id', reviewConfig.widgetId.toString());
  url.searchParams.set(
    'fields',
    'total_reviews_count,reviews.customer_properties,reviews.evaluation_properties',
  );
  url.searchParams.set('per', limit.toString());
  url.searchParams.set('page', '1');
  url.searchParams.set('sort', '20');
  url.searchParams.set('app', '0');

  return url.toString();
}

async function fetchProductReviews({ product, shopConfig, limit, fetcher }) {
  const reviewConfig = shopConfig.reviews;

  if (reviewConfig?.type === 'cafe24-html') {
    const html = await fetcher(product.source.productUrl);
    const reviews = parseCafe24Reviews(html, {
      limit,
      ...reviewConfig.parser,
    });
    return {
      reviews,
      reviewCount: Math.max(product.reviewCount ?? 0, reviews.length),
    };
  }

  if (reviewConfig?.type === 'crema-api') {
    const url = cremaReviewsUrl(
      reviewConfig,
      product.source.sourceProductId,
      limit,
    );
    const responseText = await fetcher(url, { accept: 'application/json' });
    let payload;

    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Invalid Crema JSON for product ${product.source.sourceProductId}`,
      );
    }

    const reviews = parseCremaReviews(payload, { limit });

    return {
      reviews,
      reviewCount: Number.isSafeInteger(payload?.total_reviews_count)
        ? Math.max(payload.total_reviews_count, reviews.length)
        : Math.max(product.reviewCount ?? 0, reviews.length),
    };
  }

  throw new Error(`Unsupported review source for shop ${shopConfig.id}`);
}

export async function crawlReviews({
  products,
  shopConfig,
  productLimit = products.length,
  reviewLimit = 20,
  requestDelayMs = 1_000,
  fetcher = fetchPage,
}) {
  const updatedProducts = products.map((product) => ({ ...product }));
  const targetCount = Math.min(productLimit, updatedProducts.length);
  const failures = [];

  for (let index = 0; index < targetCount; index += 1) {
    const product = updatedProducts[index];

    await wait(requestDelayMs);

    try {
      const evidence = await fetchProductReviews({
        product,
        shopConfig,
        limit: reviewLimit,
        fetcher,
      });
      product.reviews = evidence.reviews;
      product.reviewCount = evidence.reviewCount;

      console.log(
        JSON.stringify({
          event: 'crawler.reviews.product.complete',
          shopId: shopConfig.id,
          productId: product.source.sourceProductId,
          reviewCount: product.reviews.length,
          progress: `${index + 1}/${targetCount}`,
        }),
      );
    } catch (error) {
      failures.push({
        productId: product.source.sourceProductId,
        message: error.message,
      });

      console.error(
        JSON.stringify({
          event: 'crawler.reviews.product.failed',
          shopId: shopConfig.id,
          productId: product.source.sourceProductId,
          message: error.message,
          progress: `${index + 1}/${targetCount}`,
        }),
      );
    }
  }

  return { products: updatedProducts, failures };
}
