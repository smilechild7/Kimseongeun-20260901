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
