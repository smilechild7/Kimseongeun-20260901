import assert from 'node:assert/strict';
import test from 'node:test';

import { crawlReviews } from '../lib/crawl-reviews.js';

function product(reviewCount = null) {
  return {
    source: {
      shopId: 'fixture-shop',
      sourceProductId: '101',
      productUrl: 'https://shop.example/product/detail.html?product_no=101',
    },
    reviewCount,
    reviews: [],
  };
}

test('limits static Cafe24 reviews, excludes author data, and clamps reviewCount', async () => {
  const rows = Array.from(
    { length: 21 },
    (_, index) => `
      <li class="item xans-record-" data-author="작성자${index}">
        <strong class="os">실제 후기 ${index + 1}</strong>
      </li>
    `,
  ).join('');
  const result = await crawlReviews({
    products: [product(0)],
    shopConfig: {
      id: 'fixture-shop',
      reviews: { type: 'cafe24-html' },
    },
    reviewLimit: 20,
    requestDelayMs: 0,
    fetcher: async () => `<div id="prdReview"><ul>${rows}</ul></div>`,
  });

  assert.deepEqual(result.failures, []);
  assert.equal(result.products[0].reviews.length, 20);
  assert.equal(result.products[0].reviewCount, 20);
  assert.doesNotMatch(JSON.stringify(result.products[0].reviews), /작성자/u);
});

test('normalizes Crema JSON through the configured public endpoint', async () => {
  let requestedUrl = null;
  const result = await crawlReviews({
    products: [product()],
    shopConfig: {
      id: 'fixture-shop',
      reviews: {
        type: 'crema-api',
        apiBaseUrl: 'https://review.example',
        brandCode: 'shop.example',
        widgetId: 7,
      },
    },
    reviewLimit: 3,
    requestDelayMs: 0,
    fetcher: async (url) => {
      requestedUrl = new URL(url);
      return JSON.stringify({
        total_reviews_count: 1,
        reviews: [{ score: 5, filtered_message: '편안해요' }],
      });
    },
  });

  assert.equal(requestedUrl.origin, 'https://review.example');
  assert.equal(requestedUrl.pathname, '/api/shop.example/reviews');
  assert.equal(requestedUrl.searchParams.get('product_code'), '101');
  assert.equal(requestedUrl.searchParams.get('widget_id'), '7');
  assert.equal(requestedUrl.searchParams.get('per'), '3');
  assert.equal(result.products[0].reviews[0].text, '편안해요');
  assert.equal(result.products[0].reviewCount, 1);
});
