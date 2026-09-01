import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const rawProductFiles = [
  new URL('../../data/raw/graychic-pants.json', import.meta.url),
  new URL('../../data/raw/ifemme-pants.json', import.meta.url),
];

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
      assert.ok(product.crawledAt);

      if (product.originalPrice !== null) {
        assert.ok(product.originalPrice > product.price);
      }

      if (product.sizeGuideText !== null) {
        assert.doesNotMatch(product.sizeGuideText, /(작성자|작성일|조회|평점)/);
      }
    }
  });
}
