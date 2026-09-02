import assert from 'node:assert/strict';
import test from 'node:test';

import { searchProducts } from './searchProducts.js';

function fixtureCandidate(index, overrides = {}) {
  const product = {
    id: `shop:${String(index).padStart(2, '0')}`,
    source: { productUrl: `https://shop.example/${index}` },
    name: `팬츠 ${index}`,
    brand: null,
    category: 'pants',
    price: 10000 + index,
    imageUrl: `https://shop.example/${index}.jpg`,
    colors: ['네이비'],
    sizes: ['M(27~28)'],
    sizeGuideText: null,
    material: null,
    description: 'raw description',
    ...overrides.product,
  };
  const enrichment = {
    summary: '상품 요약',
    styleTags: [],
    occasionTags: [],
    fitTags: [],
    seasonTags: [],
    extraTags: [],
    reviewSummary: {
      analyzedReviewCount: 0,
      appearanceMatch: { signal: 'unknown', summary: '근거 없음' },
      sizeFit: { signal: 'unknown', summary: '근거 없음' },
      materialQuality: { signal: 'unknown', summary: '근거 없음' },
      positives: [],
      concerns: [],
      similarReviewerNotes: [],
    },
    ...overrides.enrichment,
  };
  return { product, enrichment };
}

const silentLogger = { log() {} };

test('keeps missing colors, excludes known mismatches, and preserves order under limit', () => {
  const values = [
    fixtureCandidate(1, { product: { colors: [] } }),
    fixtureCandidate(2, { product: { colors: ['네이비'] } }),
    fixtureCandidate(3, { product: { colors: ['검정'] } }),
  ];
  const repository = { findSearchCandidates: () => values };
  const result = searchProducts(
    { query: '검정 바지', required: { colors: ['black'] } },
    { repository, logger: silentLogger },
  );

  assert.equal(result.hardFilterMatchCount, 2);
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.id),
    ['shop:01', 'shop:03'],
  );
});

test('scores only when over limit and returns a compact top-15 DTO', () => {
  const values = Array.from({ length: 16 }, (_, index) => fixtureCandidate(index + 1));
  values[15] = fixtureCandidate(16, {
    product: { colors: ['검정'], imageUrl: 'https://hidden.example/image.jpg' },
    enrichment: { fitTags: ['relaxed'], occasionTags: ['office'] },
  });
  const repository = { findSearchCandidates: () => values };
  const result = searchProducts(
    {
      query: '편안한 검정 출근 바지',
      preferred: {
        colors: ['black'],
        fitTags: ['relaxed'],
        occasionTags: ['office'],
      },
    },
    { repository, logger: silentLogger },
  );

  assert.equal(result.hardFilterMatchCount, 16);
  assert.equal(result.candidates.length, 15);
  assert.equal(result.candidates[0].id, 'shop:16');
  assert.equal('imageUrl' in result.candidates[0], false);
  assert.equal('source' in result.candidates[0], false);
  assert.equal('description' in result.candidates[0], false);
  assert.equal('score' in result.candidates[0], false);
});
