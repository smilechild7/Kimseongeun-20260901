import assert from 'node:assert/strict';
import test from 'node:test';

import { buildChatMessage, selectionSummary } from './query.js';

test('combines free text and selected must-have conditions', () => {
  assert.equal(
    buildChatMessage({
      query: '편한 옷',
      category: 'pants',
      maxPrice: 70000,
      size: ' M ',
    }),
    '편한 옷\n\n선택한 필수 조건(자연어와 충돌하면 이 조건 우선): 카테고리=바지; 최대 가격=70,000원; 판매 사이즈=M',
  );
  assert.deepEqual(
    selectionSummary({ category: 'pants', maxPrice: 70000, size: 'M' }),
    ['바지', '7만원 이하', '사이즈 M'],
  );
});

test('requires natural-language input before optional selectors', () => {
  assert.equal(
    buildChatMessage({ query: '', category: 'pants', maxPrice: 50000, size: 'M' }),
    null,
  );
  assert.equal(
    buildChatMessage({ query: '  ', category: '', maxPrice: null, size: ' ' }),
    null,
  );
});
