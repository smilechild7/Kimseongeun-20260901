import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const rawProductFiles = [
  new URL('../../data/raw/graychic-pants.json', import.meta.url),
  new URL('../../data/raw/ifemme-pants.json', import.meta.url),
];

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

for (const fileUrl of rawProductFiles) {
  test(`raw products satisfy the Phase 1 contract: ${fileUrl.pathname}`, async () => {
    const products = JSON.parse(await readFile(fileUrl, 'utf8'));
    const productIds = products.map((product) => product.source.sourceProductId);

    assert.equal(products.length, 20);
    assert.equal(new Set(productIds).size, products.length);

    for (const product of products) {
      assert.ok(product.source.shopId);
      assert.ok(product.source.shopName);
      assert.ok(product.source.sourceProductId);
      assert.match(product.source.productUrl, /^https:\/\//);
      assert.ok(product.name);
      assert.equal(product.category, 'pants');
      assert.ok(Number.isSafeInteger(product.price) && product.price > 0);
      assert.match(product.imageUrl, /^https:\/\//);
      assert.ok(Array.isArray(product.colors));
      assert.ok(Array.isArray(product.sizes) && product.sizes.length > 0);
      assert.ok(
        product.sizeGuideText === null || typeof product.sizeGuideText === 'string',
      );
      assert.ok(Array.isArray(product.reviews));
      assert.ok(product.reviews.length <= 20);
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
        review.imageUrls.forEach((imageUrl) => assert.match(imageUrl, /^https:\/\//));
        assert.ok(
          review.createdAt === null ||
            (!Number.isNaN(Date.parse(review.createdAt)) &&
              /(?:Z|[+-]\d{2}:\d{2})$/u.test(review.createdAt)),
        );
      }

      if (product.originalPrice !== null) {
        assert.ok(product.originalPrice > product.price);
      }

      if (product.sizeGuideText !== null) {
        assert.doesNotMatch(product.sizeGuideText, /(작성자|작성일|조회|평점)/);
      }
    }
  });
}

test('raw products contain review evidence without reviewer identifier fields', async () => {
  let productsWithReviews = 0;

  for (const fileUrl of rawProductFiles) {
    const products = JSON.parse(await readFile(fileUrl, 'utf8'));
    productsWithReviews += products.filter((product) => product.reviews.length > 0).length;

    for (const product of products) {
      for (const review of product.reviews) {
        assert.equal('reviewerName' in review, false);
        assert.equal('reviewerId' in review, false);
        assert.equal('user_display_name' in review, false);
        assert.equal('brand_user_id' in review, false);
      }
    }
  }

  assert.ok(productsWithReviews > 0);
});
