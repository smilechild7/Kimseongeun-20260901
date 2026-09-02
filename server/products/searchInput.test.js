import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeSearchInput } from './searchInput.js';

test('fills optional search fields and removes duplicate string values', () => {
  assert.deepEqual(
    normalizeSearchInput({
      query: '  검정 바지  ',
      required: { category: 'pants', maxPrice: 100000, colors: ['black', 'black'] },
      preferred: { fitTags: ['relaxed'] },
    }),
    {
      query: '검정 바지',
      required: {
        category: 'pants',
        minPrice: null,
        maxPrice: 100000,
        colors: ['black'],
        sizes: [],
      },
      preferred: {
        colors: [],
        sizes: [],
        styleTags: [],
        occasionTags: [],
        fitTags: ['relaxed'],
        seasonTags: [],
        keywords: [],
        avoidKeywords: [],
        reviewSignals: {
          appearanceMatch: null,
          sizeFit: null,
          materialQuality: null,
        },
      },
    },
  );
});

test('rejects invalid prices, arrays, and review signals', () => {
  assert.throws(
    () =>
      normalizeSearchInput({
        query: '바지',
        required: { minPrice: 100000, maxPrice: 50000 },
      }),
    /must not exceed/u,
  );
  assert.throws(
    () => normalizeSearchInput({ query: '바지', preferred: { colors: 'black' } }),
    /array of strings/u,
  );
  assert.throws(
    () =>
      normalizeSearchInput({
        query: '바지',
        preferred: { reviewSignals: { sizeFit: 'perfect' } },
      }),
    /is invalid/u,
  );
  assert.throws(
    () =>
      normalizeSearchInput({
        query: '바지',
        preferred: { fitTags: ['comfortable'] },
      }),
    /controlled vocabulary/u,
  );
});
