import assert from 'node:assert/strict';
import test from 'node:test';

import { scoreSearchCandidate } from './retrievalScore.js';
import { normalizeSearchInput } from './searchInput.js';

function candidate() {
  return {
    product: {
      name: '편안한 검정 와이드 팬츠',
      brand: null,
      category: 'pants',
      material: '폴리 스판',
      description: '슬림하지 않은 여유 있는 바지',
      colors: ['검정'],
      sizes: ['M(27~28)'],
    },
    enrichment: {
      summary: '출근용으로 활용하기 좋은 편안한 팬츠',
      styleTags: ['minimal'],
      occasionTags: ['office'],
      fitTags: ['relaxed', 'wide'],
      seasonTags: ['spring'],
      extraTags: ['허리 밴딩'],
      reviewSummary: {
        appearanceMatch: { signal: 'unknown' },
        sizeFit: { signal: 'true_to_size' },
        materialQuality: { signal: 'positive' },
      },
    },
  };
}

test('scores soft matches by configured axis and subtracts avoid keywords', () => {
  const preferred = normalizeSearchInput({
    query: '검색',
    preferred: {
      colors: ['black'],
      sizes: ['28'],
      styleTags: ['minimal'],
      occasionTags: ['office'],
      fitTags: ['relaxed'],
      seasonTags: ['spring'],
      keywords: ['편안한'],
      avoidKeywords: ['슬림'],
      reviewSignals: { sizeFit: 'true_to_size', materialQuality: 'positive' },
    },
  }).preferred;
  const score = scoreSearchCandidate(candidate(), preferred);

  assert.deepEqual(score.breakdown, {
    keyword: 0,
    color: 2,
    size: 2,
    style: 2,
    occasion: 2,
    fit: 3,
    season: 1,
    reviewSignal: 4,
  });
  assert.equal(score.total, 16);
});

test('does not penalize missing enrichment or unknown review evidence', () => {
  const preferred = normalizeSearchInput({
    query: '검색',
    preferred: {
      styleTags: ['minimal'],
      reviewSignals: { appearanceMatch: 'similar' },
    },
  }).preferred;
  const value = candidate();
  value.enrichment = null;
  assert.equal(scoreSearchCandidate(value, preferred).total, 0);
});
