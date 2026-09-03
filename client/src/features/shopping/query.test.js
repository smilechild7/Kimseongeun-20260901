import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildChatMessage,
  CATEGORY_OPTIONS,
  selectionSummary,
} from './query.js';

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

test('supports every optional clothing category and leaves inference to AI by default', () => {
  assert.deepEqual(
    CATEGORY_OPTIONS.map(({ value }) => value),
    ['pants', 'top', 'dress', 'skirt', 'outerwear'],
  );
  assert.equal(
    buildChatMessage({
      query: '결혼식에 입을 옷',
      category: 'dress',
      maxPrice: null,
      size: '',
    }),
    '결혼식에 입을 옷\n\n선택한 필수 조건(자연어와 충돌하면 이 조건 우선): 카테고리=원피스',
  );
  assert.equal(
    buildChatMessage({
      query: '출근할 때 입을 옷',
      category: '',
      maxPrice: null,
      size: '',
    }),
    '출근할 때 입을 옷',
  );
  assert.deepEqual(
    selectionSummary({ category: 'outerwear', maxPrice: null, size: '' }),
    ['아우터'],
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
