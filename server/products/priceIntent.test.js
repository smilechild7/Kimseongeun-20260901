import assert from 'node:assert/strict';
import test from 'node:test';

import { applyPriceIntent, interpretedPriceRange } from './priceIntent.js';

test('expands a bare target price by ten percent with outward man-won rounding', () => {
  assert.deepEqual(interpretedPriceRange('8만원 바지'), {
    minPrice: 70_000,
    maxPrice: 90_000,
  });
  assert.deepEqual(interpretedPriceRange('20만원 정도의 코트'), {
    minPrice: 180_000,
    maxPrice: 220_000,
  });
  assert.deepEqual(interpretedPriceRange('50만원 전후 아우터'), {
    minPrice: 450_000,
    maxPrice: 550_000,
  });
});

test('supports won amounts and distinguishes a man-won price band', () => {
  assert.deepEqual(interpretedPriceRange('80,000원 바지'), {
    minPrice: 70_000,
    maxPrice: 90_000,
  });
  assert.deepEqual(interpretedPriceRange('8만원대 바지'), {
    minPrice: 80_000,
    maxPrice: 89_999,
  });
});

test('ignores explicit boundaries and ranges', () => {
  for (const query of [
    '8만원 이하 바지',
    '최대 가격=80,000원 바지',
    '8만원대 이하 바지',
    '7~9만원 바지',
    '7만원에서 9만원 사이 바지',
    '딱 8만원인 바지',
  ]) {
    assert.equal(interpretedPriceRange(query), null, query);
  }
});

test('overrides model price arguments only for an implicit target price', () => {
  const input = {
    query: '8만원 바지',
    required: { category: 'pants', minPrice: null, maxPrice: 80_000 },
  };

  assert.deepEqual(applyPriceIntent(input, '8만원 바지').required, {
    category: 'pants',
    minPrice: 70_000,
    maxPrice: 90_000,
  });
  assert.equal(applyPriceIntent(input, '8만원 이하 바지'), input);
});
