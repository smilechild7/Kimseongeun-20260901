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
