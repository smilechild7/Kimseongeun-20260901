function parseJson(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function positiveLimit(value, fallback = 15) {
  return Number.isSafeInteger(value) && value > 0 ? Math.min(value, 100) : fallback;
}

function hydrateProduct(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    source: {
      shopId: row.shop_id,
      shopName: row.shop_name,
      sourceProductId: row.source_product_id,
      productUrl: row.product_url,
    },
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: row.price,
    originalPrice: row.original_price,
    imageUrl: row.image_url,
    colors: parseJson(row.colors_json, []),
    sizes: parseJson(row.sizes_json, []),
    sizeGuideText: row.size_guide_text,
    material: row.material,
    description: row.description,
    rating: row.rating,
    reviewCount: row.review_count,
    crawledAt: row.crawled_at,
  };
}

function hydrateReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    rating: row.rating,
    text: row.text,
    optionText: row.option_text,
    reviewerProfile: parseJson(row.reviewer_profile_json, {
      heightCm: null,
      weightKg: null,
      usualSize: null,
      ageGroup: null,
    }),
    imageUrls: parseJson(row.image_urls_json, []),
    createdAt: row.created_at,
  };
}

function hydrateEnrichment(row) {
  if (!row) {
    return null;
  }

  return {
    productId: row.product_id,
    summary: row.summary,
    styleTags: parseJson(row.style_tags_json, []),
    occasionTags: parseJson(row.occasion_tags_json, []),
    fitTags: parseJson(row.fit_tags_json, []),
    seasonTags: parseJson(row.season_tags_json, []),
    extraTags: parseJson(row.extra_tags_json, []),
    reviewSummary: parseJson(row.review_summary_json, null),
    model: row.model,
    promptVersion: row.prompt_version,
    enrichedAt: row.enriched_at,
  };
}

function hydrateJoinedEnrichment(row) {
  if (!row.enrichment_product_id) {
    return null;
  }

  return {
    productId: row.enrichment_product_id,
    summary: row.enrichment_summary,
    styleTags: parseJson(row.enrichment_style_tags_json, []),
    occasionTags: parseJson(row.enrichment_occasion_tags_json, []),
    fitTags: parseJson(row.enrichment_fit_tags_json, []),
    seasonTags: parseJson(row.enrichment_season_tags_json, []),
    extraTags: parseJson(row.enrichment_extra_tags_json, []),
    reviewSummary: parseJson(row.enrichment_review_summary_json, null),
  };
}

export function productIdForSource(shopId, sourceProductId) {
  return `${shopId}:${sourceProductId}`;
}

export function createProductRepository(database) {
  const selectProductColumns = `
    SELECT
      products.*,
      shops.name AS shop_name
    FROM products
    JOIN shops ON shops.id = products.shop_id
  `;
  const selectSearchCandidateColumns = `
    SELECT
      products.*,
      shops.name AS shop_name,
      product_enrichments.product_id AS enrichment_product_id,
      product_enrichments.summary AS enrichment_summary,
      product_enrichments.style_tags_json AS enrichment_style_tags_json,
      product_enrichments.occasion_tags_json AS enrichment_occasion_tags_json,
      product_enrichments.fit_tags_json AS enrichment_fit_tags_json,
      product_enrichments.season_tags_json AS enrichment_season_tags_json,
      product_enrichments.extra_tags_json AS enrichment_extra_tags_json,
      product_enrichments.review_summary_json AS enrichment_review_summary_json
    FROM products
    JOIN shops ON shops.id = products.shop_id
    LEFT JOIN product_enrichments
      ON product_enrichments.product_id = products.id
  `;
  const upsertShop = database.prepare(`
    INSERT INTO shops (id, name, base_url)
    VALUES (@id, @name, @baseUrl)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      base_url = excluded.base_url
  `);
  const upsertProduct = database.prepare(`
    INSERT INTO products (
      id,
      shop_id,
      source_product_id,
      name,
      brand,
      category,
      price,
      original_price,
      image_url,
      product_url,
      colors_json,
      sizes_json,
      size_guide_text,
      material,
      description,
      rating,
      review_count,
      crawled_at
    ) VALUES (
      @id,
      @shopId,
      @sourceProductId,
      @name,
      @brand,
      @category,
      @price,
      @originalPrice,
      @imageUrl,
      @productUrl,
      @colorsJson,
      @sizesJson,
      @sizeGuideText,
      @material,
      @description,
      @rating,
      @reviewCount,
      @crawledAt
    )
    ON CONFLICT(shop_id, source_product_id) DO UPDATE SET
      id = excluded.id,
      name = excluded.name,
      brand = excluded.brand,
      category = excluded.category,
      price = excluded.price,
      original_price = excluded.original_price,
      image_url = excluded.image_url,
      product_url = excluded.product_url,
      colors_json = excluded.colors_json,
      sizes_json = excluded.sizes_json,
      size_guide_text = excluded.size_guide_text,
      material = excluded.material,
      description = excluded.description,
      rating = excluded.rating,
      review_count = excluded.review_count,
      crawled_at = excluded.crawled_at
  `);
  const deleteReviews = database.prepare(
    'DELETE FROM reviews WHERE product_id = ?',
  );
  const insertReview = database.prepare(`
    INSERT INTO reviews (
      product_id,
      rating,
      text,
      option_text,
      reviewer_profile_json,
      image_urls_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const upsertEnrichment = database.prepare(`
    INSERT INTO product_enrichments (
      product_id,
      summary,
      style_tags_json,
      occasion_tags_json,
      fit_tags_json,
      season_tags_json,
      extra_tags_json,
      review_summary_json,
      model,
      prompt_version,
      enriched_at
    ) VALUES (
      @productId,
      @summary,
      @styleTagsJson,
      @occasionTagsJson,
      @fitTagsJson,
      @seasonTagsJson,
      @extraTagsJson,
      @reviewSummaryJson,
      @model,
      @promptVersion,
      @enrichedAt
    )
    ON CONFLICT(product_id) DO UPDATE SET
      summary = excluded.summary,
      style_tags_json = excluded.style_tags_json,
      occasion_tags_json = excluded.occasion_tags_json,
      fit_tags_json = excluded.fit_tags_json,
      season_tags_json = excluded.season_tags_json,
      extra_tags_json = excluded.extra_tags_json,
      review_summary_json = excluded.review_summary_json,
      model = excluded.model,
      prompt_version = excluded.prompt_version,
      enriched_at = excluded.enriched_at
  `);
  const saveProductsTransaction = database.transaction((products) => {
    for (const product of products) {
      const shopId = product.source.shopId;
      const sourceProductId = product.source.sourceProductId;
      const productId = productIdForSource(shopId, sourceProductId);
      const baseUrl = new URL(product.source.productUrl).origin;

      upsertShop.run({
        id: shopId,
        name: product.source.shopName,
        baseUrl,
      });
      upsertProduct.run({
        id: productId,
        shopId,
        sourceProductId,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        imageUrl: product.imageUrl,
        productUrl: product.source.productUrl,
        colorsJson: JSON.stringify(product.colors ?? []),
        sizesJson: JSON.stringify(product.sizes ?? []),
        sizeGuideText: product.sizeGuideText,
        material: product.material,
        description: product.description,
        rating: product.rating,
        reviewCount: product.reviewCount,
        crawledAt: product.crawledAt,
      });

      deleteReviews.run(productId);
      for (const review of product.reviews ?? []) {
        insertReview.run(
          productId,
          review.rating,
          review.text,
          review.optionText,
          JSON.stringify(review.reviewerProfile),
          JSON.stringify(review.imageUrls ?? []),
          review.createdAt,
        );
      }
    }
  });
  const saveEnrichmentsTransaction = database.transaction((enrichments) => {
    for (const enrichment of enrichments) {
      upsertEnrichment.run({
        productId: enrichment.productId,
        summary: enrichment.summary,
        styleTagsJson: JSON.stringify(enrichment.styleTags ?? []),
        occasionTagsJson: JSON.stringify(enrichment.occasionTags ?? []),
        fitTagsJson: JSON.stringify(enrichment.fitTags ?? []),
        seasonTagsJson: JSON.stringify(enrichment.seasonTags ?? []),
        extraTagsJson: JSON.stringify(enrichment.extraTags ?? []),
        reviewSummaryJson: JSON.stringify(enrichment.reviewSummary),
        model: enrichment.model,
        promptVersion: enrichment.promptVersion,
        enrichedAt: enrichment.enrichedAt,
      });
    }
  });

  return {
    saveProducts(products) {
      saveProductsTransaction(products);
      return products.length;
    },

    saveProductEnrichments(enrichments) {
      saveEnrichmentsTransaction(enrichments);
      return enrichments.length;
    },

    searchProducts({ category, minPrice, maxPrice, shopIds, limit } = {}) {
      const conditions = [];
      const parameters = {};

      if (category) {
        conditions.push('products.category = @category');
        parameters.category = category;
      }
      if (Number.isSafeInteger(minPrice)) {
        conditions.push('products.price >= @minPrice');
        parameters.minPrice = minPrice;
      }
      if (Number.isSafeInteger(maxPrice)) {
        conditions.push('products.price <= @maxPrice');
        parameters.maxPrice = maxPrice;
      }
      if (Array.isArray(shopIds) && shopIds.length > 0) {
        const placeholders = shopIds.map((_, index) => `@shopId${index}`);
        conditions.push(`products.shop_id IN (${placeholders.join(', ')})`);
        shopIds.forEach((shopId, index) => {
          parameters[`shopId${index}`] = shopId;
        });
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      parameters.limit = positiveLimit(limit);

      return database
        .prepare(`
          ${selectProductColumns}
          ${where}
          ORDER BY products.price ASC, products.id ASC
          LIMIT @limit
        `)
        .all(parameters)
        .map(hydrateProduct);
    },

    findSearchCandidates({ category, minPrice, maxPrice } = {}) {
      const conditions = [];
      const parameters = {};

      if (category) {
        conditions.push('products.category = @category');
        parameters.category = category;
      }
      if (Number.isSafeInteger(minPrice)) {
        conditions.push('products.price >= @minPrice');
        parameters.minPrice = minPrice;
      }
      if (Number.isSafeInteger(maxPrice)) {
        conditions.push('products.price <= @maxPrice');
        parameters.maxPrice = maxPrice;
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      return database
        .prepare(`
          ${selectSearchCandidateColumns}
          ${where}
          ORDER BY products.price ASC, products.id ASC
        `)
        .all(parameters)
        .map((row) => ({
          product: hydrateProduct(row),
          enrichment: hydrateJoinedEnrichment(row),
        }));
    },

    getProductById(id) {
      return hydrateProduct(
        database.prepare(`${selectProductColumns} WHERE products.id = ?`).get(id),
      );
    },

    getProductsByIds(ids) {
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      const placeholders = ids.map(() => '?').join(', ');
      const productsById = new Map(
        database
          .prepare(
            `${selectProductColumns} WHERE products.id IN (${placeholders})`,
          )
          .all(...ids)
          .map((row) => {
            const product = hydrateProduct(row);
            return [product.id, product];
          }),
      );

      return ids.map((id) => productsById.get(id)).filter(Boolean);
    },

    getReviewsByProductId(productId) {
      return database
        .prepare(`
          SELECT *
          FROM reviews
          WHERE product_id = ?
          ORDER BY created_at DESC, id DESC
        `)
        .all(productId)
        .map(hydrateReview);
    },

    getProductEnrichment(productId) {
      return hydrateEnrichment(
        database
          .prepare('SELECT * FROM product_enrichments WHERE product_id = ?')
          .get(productId),
      );
    },
  };
}
