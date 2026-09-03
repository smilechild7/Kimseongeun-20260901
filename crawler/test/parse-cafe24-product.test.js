import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCafe24Product } from '../lib/parse-cafe24-product.js';

const shopConfig = {
  id: 'fixture-shop',
  name: 'Fixture Shop',
  baseUrl: 'https://shop.example',
};
const categoryConfig = { id: 'pants', name: '바지' };

test('parses factual Cafe24 product fields including options and size guide text', () => {
  const html = `
    <meta property="og:title" content="테스트 팬츠">
    <meta property="og:image" content="//cdn.example/pants.jpg">
    <meta property="og:description" content="편안한 바지">
    <meta property="product:price:amount" content="59000">
    <strong id="span_product_price_text">59,000원</strong>
    <span id="span_product_price_sale">49,000원 (10,000원 할인)</span>
    <select option_product_no="1234" option_title="color">
      <option value="*">색상 선택</option>
      <option value="네이비">네이비</option>
    </select>
    <ul option_product_no="1234" option_title="size">
      <li option_value="S"><span>S</span></li>
      <li option_value="M"><span>M</span></li>
    </ul>
    <table><tr><th>소재</th><td>면 97%, 스판 3%</td></tr></table>
    <div id="prdDetail">
      <table><tr><th>사이즈</th><th>허리</th><th>총장</th></tr><tr><td>S</td><td>68cm</td><td>98cm</td></tr></table>
    </div>
  `;

  const product = parseCafe24Product(html, {
    shopConfig,
    categoryConfig,
    productUrl: 'https://shop.example/product/detail.html?product_no=1234',
    crawledAt: '2026-09-02T00:00:00.000Z',
  });

  assert.deepEqual(product, {
    source: {
      shopId: 'fixture-shop',
      shopName: 'Fixture Shop',
      sourceProductId: '1234',
      productUrl: 'https://shop.example/product/detail.html?product_no=1234',
    },
    name: '테스트 팬츠',
    brand: null,
    category: 'pants',
    price: 49000,
    originalPrice: 59000,
    imageUrl: 'https://cdn.example/pants.jpg',
    colors: ['네이비'],
    sizes: ['S', 'M'],
    sizeGuideText: '사이즈 허리 총장 S 68cm 98cm',
    material: '면 97%, 스판 3%',
    description: '편안한 바지',
    rating: null,
    reviewCount: null,
    reviews: [],
    crawledAt: '2026-09-02T00:00:00.000Z',
  });
});

test('rejects a dimension-like description that is not a structured size table', () => {
  const html = `
    <meta property="og:title" content="설명 오수집 방지 팬츠">
    <meta property="og:image" content="https://cdn.example/pants.jpg">
    <meta property="product:price:amount" content="40000">
    <select option_product_no="101" option_title="size">
      <option value="S">S</option>
      <option value="M">M</option>
    </select>
    <div id="prdDetail">
      <table><tr><td>MD comment 허리와 힙이 여유 있고 총장이 긴 디자인 100 110</td></tr></table>
    </div>
  `;

  const product = parseCafe24Product(html, {
    shopConfig,
    categoryConfig,
    productUrl: 'https://shop.example/product/detail.html?product_no=101',
  });

  assert.equal(product.sizeGuideText, null);
});

test('keeps sizeGuideText null when only an image guide is available', () => {
  const html = `
    <meta property="og:title" content="이미지 사이즈표 팬츠">
    <meta property="og:image" content="https://cdn.example/pants.jpg">
    <meta property="product:price:amount" content="40000">
    <select option_product_no="99" option_title="size">
      <option value="Free(26~28)" disabled>Free(26~28)</option>
      <option value="L(29~31)" disabled>L(29~31)</option>
    </select>
    <div id="prdDetail">
      <img src="/size-guide.jpg" alt="사이즈표">
      <table><tr><th>번호</th><th>제목</th><th>작성자</th><th>평점</th></tr><tr><td>1</td><td>허리 사이즈가 잘 맞아요</td><td>구매자</td><td>5</td></tr></table>
    </div>
  `;

  const product = parseCafe24Product(html, {
    shopConfig,
    categoryConfig,
    productUrl: 'https://shop.example/product/detail.html?product_no=99',
  });

  assert.deepEqual(product.sizes, ['Free(26~28)', 'L(29~31)']);
  assert.equal(product.sizeGuideText, null);
});

test('uses an explicit product-name size only when no size option exists', () => {
  const html = `
    <meta property="og:title" content="린넨 팬츠[FREE(55-66)]">
    <meta property="og:image" content="https://cdn.example/free-pants.jpg">
    <meta property="product:price:amount" content="39000">
    <select option_product_no="100" option_title="color">
      <option value="브라운">브라운</option>
    </select>
  `;

  const product = parseCafe24Product(html, {
    shopConfig,
    categoryConfig,
    productUrl: 'https://shop.example/product/detail.html?product_no=100',
  });

  assert.deepEqual(product.sizes, ['FREE(55-66)']);
});

test('splits composite color and size options and ignores add-product options', () => {
  const html = `
    <meta property="og:title" content="복합 옵션 데님">
    <meta property="og:image" content="https://cdn.example/denim.jpg">
    <meta property="product:price:amount" content="59000">
    <select option_product_no="200" product_type="product_option" option_title="타입">
      <option value="*">타입 선택</option>
      <option value="CODE1">데님(denim)-S</option>
      <option value="CODE2">롱_데님(denim)-M</option>
    </select>
    <select option_product_no="201" product_type="addproduct_option" option_title="색상">
      <option value="아이보리">아이보리</option>
    </select>
  `;
  const compositeShopConfig = {
    ...shopConfig,
    options: { compositeTitlePatterns: [/^타입$/i] },
  };

  const product = parseCafe24Product(html, {
    shopConfig: compositeShopConfig,
    categoryConfig,
    productUrl: 'https://shop.example/product/detail.html?product_no=200',
  });

  assert.deepEqual(product.colors, ['데님']);
  assert.deepEqual(product.sizes, ['S', 'M']);
});

test('parses slash-delimited composite options using visible labels', () => {
  const html = `
    <meta property="og:title" content="길이 색상 사이즈 팬츠">
    <meta property="og:image" content="https://cdn.example/slacks.jpg">
    <meta property="product:price:amount" content="49000">
    <select option_product_no="300" product_type="product_option" option_title="길이/색상/사이즈">
      <option value="P000A">숏/블루/S</option>
      <option value="P000B">롱/블랙/2XL (+2,000원)</option>
    </select>
  `;

  const product = parseCafe24Product(html, {
    shopConfig,
    categoryConfig,
    productUrl: 'https://shop.example/product/detail.html?product_no=300',
  });

  assert.deepEqual(product.colors, ['블루', '블랙']);
  assert.deepEqual(product.sizes, ['S', '2XL']);
});

test('uses JSON-LD name when og:title is only the shop name', () => {
  const html = `
    <meta property="og:title" content="Fixture Shop">
    <meta property="og:image" content="https://cdn.example/skirt.jpg">
    <meta property="product:price:amount" content="39000">
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Product","name":"오간자 스커트"}
    </script>
  `;

  const product = parseCafe24Product(html, {
    shopConfig,
    categoryConfig: { id: 'skirt' },
    productUrl: 'https://shop.example/product/detail.html?product_no=400',
  });

  assert.equal(product.name, '오간자 스커트');
});

test('ignores a homepage og:image and uses the product image element', () => {
  const html = `
    <meta property="og:title" content="테스트 재킷">
    <meta property="og:image" content="http://shop.example/">
    <meta property="product:price:amount" content="79000">
    <div class="keyImg"><img src="//cdn.example/jacket.jpg"></div>
  `;

  const product = parseCafe24Product(html, {
    shopConfig,
    categoryConfig: { id: 'outerwear' },
    productUrl: 'https://shop.example/product/detail.html?product_no=300',
  });

  assert.equal(product.imageUrl, 'https://cdn.example/jacket.jpg');
});
