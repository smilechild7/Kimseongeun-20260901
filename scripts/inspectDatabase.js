import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { openDatabase } from '../server/db/connection.js';
import { createProductRepository } from '../server/products/productRepository.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const productIdArgument = process.argv.find((argument) =>
  argument.startsWith('--product-id='),
);
const productId = productIdArgument?.slice('--product-id='.length) || 'ifemme:31358';
const database = openDatabase(path.join(repositoryRoot, 'data/products.db'), {
  readonly: true,
  fileMustExist: true,
});

try {
  const repository = createProductRepository(database);
  const product = repository.getProductById(productId);
  const reviews = product ? repository.getReviewsByProductId(productId) : [];
  const counts = {
    shops: database.prepare('SELECT COUNT(*) count FROM shops').get().count,
    products: database.prepare('SELECT COUNT(*) count FROM products').get().count,
    reviews: database.prepare('SELECT COUNT(*) count FROM reviews').get().count,
    enrichments: database
      .prepare('SELECT COUNT(*) count FROM product_enrichments')
      .get().count,
  };

  console.log(
    JSON.stringify(
      {
        event: 'db.inspect.complete',
        counts,
        integrity: database.pragma('integrity_check', { simple: true }),
        sample: product
          ? {
              id: product.id,
              name: product.name,
              storedReviewCount: product.reviewCount,
              importedReviewCount: reviews.length,
              firstReview: reviews[0]?.text ?? null,
            }
          : null,
      },
      null,
      2,
    ),
  );
} finally {
  database.close();
}
