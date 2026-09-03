import assert from 'node:assert/strict';
import test from 'node:test';

import { discoverProductUrls } from '../lib/discover-product-urls.js';

test('discovers unique products and applies the shop product filter', () => {
  const html = `
    <a id="anchorBoxName_1" href="/product/린넨-팬츠/101/category/12/">팬츠</a>
    <a id="anchorBoxName_1_dup" href="/product/린넨-팬츠/101/category/12/">팬츠</a>
    <a id="anchorBoxName_2" href="/product/린넨-스커트/102/category/12/">스커트</a>
    <a id="anchorBoxName_3" href="/product/데님-청바지/103/category/12/">데님</a>
  `;
  const shopConfig = {
    baseUrl: 'https://shop.example',
    discovery: {
      productLinkSelectors: ['a[id^="anchorBoxName_"]'],
      includeProductPattern: /(팬츠|청바지|데님)/,
    },
  };

  assert.deepEqual(discoverProductUrls(html, shopConfig, 10), [
    'https://shop.example/product/%EB%A6%B0%EB%84%A8-%ED%8C%AC%EC%B8%A0/101/category/12/',
    'https://shop.example/product/%EB%8D%B0%EB%8B%98-%EC%B2%AD%EB%B0%94%EC%A7%80/103/category/12/',
  ]);
});

test('allows category discovery rules to override shop defaults', () => {
  const html = `
    <a class="product" href="/product/린넨-팬츠/101/category/12/">린넨 팬츠</a>
    <a class="product" href="/product/플레어-스커트/102/category/12/">플레어 스커트</a>
  `;
  const shopConfig = {
    baseUrl: 'https://shop.example',
    discovery: {
      productLinkSelectors: ['a[id^="anchorBoxName_"]'],
    },
  };
  const categoryConfig = {
    discovery: {
      productLinkSelectors: ['a.product'],
      includeProductPattern: /(스커트|skirt)/i,
    },
  };

  assert.deepEqual(
    discoverProductUrls(html, shopConfig, 10, categoryConfig),
    [
      'https://shop.example/product/%ED%94%8C%EB%A0%88%EC%96%B4-%EC%8A%A4%EC%BB%A4%ED%8A%B8/102/category/12/',
    ],
  );
});

test('filters image-only links using the surrounding product card label', () => {
  const html = `
    <div class="box">
      <a name="anchorBoxName_201" href="/product/detail.html?product_no=201"><img alt=""></a>
      <p class="name"><a href="/product/detail.html?product_no=201">플레어 스커트</a></p>
    </div>
    <div class="box">
      <a name="anchorBoxName_202" href="/product/detail.html?product_no=202"><img alt=""></a>
      <p class="name"><a href="/product/detail.html?product_no=202">와이드 팬츠</a></p>
    </div>
  `;
  const shopConfig = {
    baseUrl: 'https://shop.example',
    discovery: {
      productLinkSelectors: ['a[name^="anchorBoxName_"]'],
    },
  };
  const categoryConfig = {
    discovery: { includeProductPattern: /(스커트|skirt)/i },
  };

  assert.deepEqual(
    discoverProductUrls(html, shopConfig, 10, categoryConfig),
    ['https://shop.example/product/detail.html?product_no=201'],
  );
});

test('skips previously claimed products and backfills from later candidates', () => {
  const html = `
    <a class="product" href="/product/detail.html?product_no=101">상의 101</a>
    <a class="product" href="/product/detail.html?product_no=102">상의 102</a>
    <a class="product" href="/product/detail.html?product_no=103">상의 103</a>
    <a class="product" href="/product/detail.html?product_no=104">상의 104</a>
  `;
  const shopConfig = {
    baseUrl: 'https://shop.example',
    discovery: { productLinkSelectors: ['a.product'] },
  };

  assert.deepEqual(
    discoverProductUrls(
      html,
      shopConfig,
      2,
      null,
      new Set(['101', '102']),
    ),
    [
      'https://shop.example/product/detail.html?product_no=103',
      'https://shop.example/product/detail.html?product_no=104',
    ],
  );
});
