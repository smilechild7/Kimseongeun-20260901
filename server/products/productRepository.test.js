import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { openDatabase } from '../db/connection.js';
import { runMigrations } from '../db/migrationRunner.js';
import {
  createProductRepository,
  productIdForSource,
} from './productRepository.js';

const migrationsDirectory = fileURLToPath(
  new URL('../../db/migrations', import.meta.url),
);

function fixtureProduct({ price = 59000, reviewText = '편하고 좋아요' } = {}) {
  return {
    source: {
      shopId: 'fixture-shop',
      shopName: 'Fixture Shop',
      sourceProductId: '1234',
      productUrl: 'https://shop.example/product/1234',
    },
    name: '테스트 팬츠',
    brand: null,
    category: 'pants',
    price,
    originalPrice: 69000,
    imageUrl: 'https://shop.example/product.jpg',
    colors: ['black'],
    sizes: ['M', 'L'],
    sizeGuideText: 'M 허리 70cm 총장 100cm',
    material: '면 100%',
    description: '테스트 설명',
    rating: 5,
    reviewCount: 1,
    reviews: [
      {
        rating: 5,
        text: reviewText,
        optionText: 'color: black / size: M',
        reviewerProfile: {
          heightCm: 165,
          weightKg: null,
          usualSize: 'M',
          ageGroup: '40대',
        },
        imageUrls: ['https://shop.example/review.jpg'],
        createdAt: '2026-09-01T12:00:00+09:00',
      },
    ],
    crawledAt: '2026-09-02T00:00:00.000Z',
  };
}

test('UPSERTs products and replaces their review snapshot without duplicates', async () => {
  const database = openDatabase(':memory:');

  try {
    await runMigrations(database, migrationsDirectory);
    const repository = createProductRepository(database);
    const productId = productIdForSource('fixture-shop', '1234');

    repository.saveProducts([fixtureProduct()]);
    repository.saveProducts([
      fixtureProduct({ price: 49000, reviewText: '수정된 최신 리뷰' }),
    ]);

    assert.deepEqual(
      database
        .prepare(
          'SELECT (SELECT COUNT(*) FROM products) products, (SELECT COUNT(*) FROM reviews) reviews',
        )
        .get(),
      { products: 1, reviews: 1 },
    );
    assert.equal(repository.getProductById(productId).price, 49000);
    assert.equal(
      repository.getReviewsByProductId(productId)[0].text,
      '수정된 최신 리뷰',
    );
    assert.equal(
      repository.searchProducts({
        category: 'pants',
        maxPrice: 50000,
      })[0].id,
      productId,
    );
    assert.deepEqual(
      repository.getProductsByIds(['missing', productId]).map((product) => product.id),
      [productId],
    );
  } finally {
    database.close();
  }
});

test('enforces the product-review foreign key and cascade delete', async () => {
  const database = openDatabase(':memory:');

  try {
    await runMigrations(database, migrationsDirectory);
    const repository = createProductRepository(database);
    const productId = productIdForSource('fixture-shop', '1234');
    repository.saveProducts([fixtureProduct()]);

    assert.throws(
      () =>
        database
          .prepare(
            'INSERT INTO reviews (product_id, text) VALUES (?, ?)',
          )
          .run('missing-product', '연결되면 안 되는 리뷰'),
      /FOREIGN KEY constraint failed/u,
    );

    database.prepare('DELETE FROM products WHERE id = ?').run(productId);
    assert.equal(
      database.prepare('SELECT COUNT(*) count FROM reviews').get().count,
      0,
    );
  } finally {
    database.close();
  }
});
