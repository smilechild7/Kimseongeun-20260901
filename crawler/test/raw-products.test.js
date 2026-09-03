import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

import { parseSizeGuideText } from '../../shared/sizeGuide.js';
import { SHOPS } from '../config/shops.js';
import {
  CATEGORY_ORDER,
  PRESERVED_CATEGORY_COUNTS,
} from '../lib/crawl-catalog.js';

const rawDataDirectory = new URL('../../data/raw/', import.meta.url);
const expectedCollections = Object.keys(SHOPS).flatMap((shopId) =>
  CATEGORY_ORDER.map((categoryId) => ({
    shopId,
    categoryId,
    fileName: `${shopId}-${categoryId}.json`,
    expectedCount:
      PRESERVED_CATEGORY_COUNTS.get(`${shopId}:${categoryId}`) ?? 10,
  })),
);
const reviewKeys = [
  'createdAt',
  'imageUrls',
  'optionText',
  'rating',
  'reviewerProfile',
  'text',
];

function assertNullableString(value) {
  assert.ok(value === null || typeof value === 'string');
}

async function readProducts(fileName) {
  return JSON.parse(await readFile(new URL(fileName, rawDataDirectory), 'utf8'));
}

test('raw catalog contains every configured shop/category collection', async () => {
  const actualFiles = (await readdir(rawDataDirectory))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
  const expectedFiles = expectedCollections.map(({ fileName }) => fileName).sort();

  assert.deepEqual(actualFiles, expectedFiles);
});

test('raw catalog satisfies count, category, review, and uniqueness contracts', async () => {
  const globallyClaimedProducts = new Set();
  let totalProducts = 0;
  let productsWithReviews = 0;

  for (const collection of expectedCollections) {
    const products = await readProducts(collection.fileName);
    const localProductIds = products.map(
      (product) => product.source.sourceProductId,
    );

    assert.equal(
      products.length,
      collection.expectedCount,
      collection.fileName,
    );
    assert.equal(new Set(localProductIds).size, products.length);
    totalProducts += products.length;

    for (const product of products) {
      const globalProductId = `${product.source.shopId}:${product.source.sourceProductId}`;

      assert.equal(product.source.shopId, collection.shopId);
      assert.ok(product.source.shopName);
      assert.ok(product.source.sourceProductId);
      assert.equal(globallyClaimedProducts.has(globalProductId), false);
      globallyClaimedProducts.add(globalProductId);
      assert.match(product.source.productUrl, /^https:\/\//u);
      assert.ok(product.name);
      assert.equal(product.category, collection.categoryId);
      assert.ok(Number.isSafeInteger(product.price) && product.price > 0);
      assert.match(product.imageUrl, /^https:\/\//u);
      assert.ok(Array.isArray(product.colors));
      assert.ok(Array.isArray(product.sizes));
      if (
        collection.categoryId === 'pants' &&
        ['graychic', 'ifemme'].includes(collection.shopId)
      ) {
        assert.ok(product.sizes.length > 0);
      }
      assertNullableString(product.sizeGuideText);
      assert.ok(Array.isArray(product.reviews));
      assert.ok(product.reviews.length <= 20);
      productsWithReviews += product.reviews.length > 0 ? 1 : 0;
      if (product.reviewCount !== null) {
        assert.ok(product.reviewCount >= product.reviews.length);
      }
      assert.ok(product.crawledAt);

      for (const review of product.reviews) {
        assert.deepEqual(Object.keys(review).sort(), reviewKeys);
        assert.ok(
          review.rating === null ||
            (Number.isFinite(review.rating) &&
              review.rating >= 1 &&
              review.rating <= 5),
        );
        assert.ok(typeof review.text === 'string' && review.text.length > 0);
        assertNullableString(review.optionText);
        assert.deepEqual(Object.keys(review.reviewerProfile).sort(), [
          'ageGroup',
          'heightCm',
          'usualSize',
          'weightKg',
        ]);
        assert.ok(
          review.reviewerProfile.heightCm === null ||
            Number.isFinite(review.reviewerProfile.heightCm),
        );
        assert.ok(
          review.reviewerProfile.weightKg === null ||
            Number.isFinite(review.reviewerProfile.weightKg),
        );
        assertNullableString(review.reviewerProfile.usualSize);
        assertNullableString(review.reviewerProfile.ageGroup);
        assert.ok(Array.isArray(review.imageUrls));
        review.imageUrls.forEach((imageUrl) =>
          assert.match(imageUrl, /^https:\/\//u),
        );
        assert.ok(
          review.createdAt === null ||
            (!Number.isNaN(Date.parse(review.createdAt)) &&
              /(?:Z|[+-]\d{2}:\d{2})$/u.test(review.createdAt)),
        );
        assert.equal('reviewerName' in review, false);
        assert.equal('reviewerId' in review, false);
        assert.equal('user_display_name' in review, false);
        assert.equal('brand_user_id' in review, false);
      }

      if (product.originalPrice !== null) {
        assert.ok(product.originalPrice > product.price);
      }

      if (product.sizeGuideText !== null) {
        assert.doesNotMatch(product.sizeGuideText, /(작성자|작성일|조회|평점)/u);
        assert.ok(
          parseSizeGuideText(product.sizeGuideText, product.sizes),
          `${collection.fileName}:${product.source.sourceProductId}`,
        );
      }
    }
  }

  assert.equal(totalProducts, 520);
  assert.equal(globallyClaimedProducts.size, 520);
  assert.ok(productsWithReviews > 0);
});
