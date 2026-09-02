CREATE TABLE shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,

  shop_id TEXT NOT NULL,
  source_product_id TEXT NOT NULL,

  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,

  price INTEGER NOT NULL,
  original_price INTEGER,

  image_url TEXT NOT NULL,
  product_url TEXT NOT NULL,

  colors_json TEXT,
  sizes_json TEXT,
  size_guide_text TEXT,

  material TEXT,
  description TEXT,

  rating REAL,
  review_count INTEGER,

  crawled_at TEXT NOT NULL,

  FOREIGN KEY (shop_id)
    REFERENCES shops(id),

  UNIQUE(shop_id, source_product_id)
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  product_id TEXT NOT NULL,

  rating REAL,
  text TEXT NOT NULL,

  option_text TEXT,
  reviewer_profile_json TEXT,
  image_urls_json TEXT,

  created_at TEXT,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE product_enrichments (
  product_id TEXT PRIMARY KEY,

  summary TEXT,

  style_tags_json TEXT,
  occasion_tags_json TEXT,
  fit_tags_json TEXT,
  season_tags_json TEXT,
  extra_tags_json TEXT,

  review_summary_json TEXT,

  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  enriched_at TEXT NOT NULL,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE INDEX products_category_price_idx
  ON products(category, price);

CREATE INDEX reviews_product_id_idx
  ON reviews(product_id);
