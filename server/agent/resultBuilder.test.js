import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAgentResult } from './resultBuilder.js';

const candidate = {
  id: 'shop:1',
  name: '와이드 팬츠',
  brand: null,
  category: 'pants',
  price: 59000,
  colors: ['검정'],
  sizes: ['M(27~28)'],
  sizeGuideText: 'M 허리 70cm',
  material: '면',
  summary: '출근용 와이드 팬츠',
  styleTags: ['minimal'],
  occasionTags: ['office'],
  fitTags: ['wide'],
  seasonTags: ['fall'],
  extraTags: [],
  reviewSummary: {
    appearanceMatch: { signal: 'similar', summary: '비슷함' },
    sizeFit: { signal: 'true_to_size', summary: '정사이즈' },
    materialQuality: { signal: 'positive', summary: '소재 긍정' },
  },
};
const factualProduct = {
  id: 'shop:1',
  source: {
    shopName: '쇼핑몰',
    productUrl: 'https://shop.example/products/1',
  },
  name: '와이드 팬츠',
  brand: null,
  category: 'pants',
  price: 59000,
  imageUrl: 'https://shop.example/1.jpg',
  colors: ['검정'],
  sizes: ['M(27~28)'],
  sizeGuideText: 'M 허리 70cm',
  material: '면',
  rating: 4.8,
  reviewCount: 10,
};
const latestSearch = {
  input: {
    required: {
      category: 'pants',
      minPrice: null,
      maxPrice: 100000,
      colors: ['black'],
      sizes: ['28'],
    },
    preferred: {},
  },
  result: { candidates: [candidate] },
};
const repository = { getProductsByIds: () => [factualProduct] };

function output(evidence) {
  return {
    type: 'recommendation',
    message: '골랐어요.',
    recommendations: [
      {
        productId: 'shop:1',
        reason: '조건에 맞아요.',
        evidence,
        strengths: ['출근용'],
        concerns: ['실측 확인 필요'],
      },
    ],
    comparison: [],
  };
}

test('validates evidence and merges only factual DB product fields', () => {
  const result = buildAgentResult({
    output: output([
      { type: 'price', value: 'within_required_range' },
      { type: 'color', value: 'black' },
      { type: 'size', value: '28' },
      { type: 'occasion', value: 'office' },
      { type: 'review_size_fit', value: 'true_to_size' },
    ]),
    responseId: 'resp_final',
    latestSearch,
    repository,
  });

  assert.equal(result.products[0].imageUrl, factualProduct.imageUrl);
  assert.equal(result.products[0].productUrl, factualProduct.source.productUrl);
  assert.equal(result.products[0].price, 59000);
  assert.equal(result.criteria.required.maxPrice, 100000);
});

test('rejects hallucinated evidence and products outside candidates', () => {
  assert.throws(
    () =>
      buildAgentResult({
        output: output([{ type: 'occasion', value: 'wedding' }]),
        responseId: 'resp_final',
        latestSearch,
        repository,
      }),
    /evidence does not match/u,
  );

  const invalid = output([{ type: 'occasion', value: 'office' }]);
  invalid.recommendations[0].productId = 'shop:missing';
  assert.throws(
    () =>
      buildAgentResult({
        output: invalid,
        responseId: 'resp_final',
        latestSearch,
        repository,
      }),
    /outside the latest candidate/u,
  );
});

test('rejects unknown review signals as recommendation evidence', () => {
  const candidateWithUnknown = structuredClone(candidate);
  candidateWithUnknown.reviewSummary.appearanceMatch.signal = 'unknown';

  assert.throws(
    () =>
      buildAgentResult({
        output: output([
          { type: 'review_appearance_match', value: 'unknown' },
        ]),
        responseId: 'resp_final',
        latestSearch: {
          ...latestSearch,
          result: { candidates: [candidateWithUnknown] },
        },
        repository,
      }),
    /evidence does not match/u,
  );
});
