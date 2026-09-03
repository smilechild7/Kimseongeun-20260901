import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSizeGuideText } from './sizeGuide.js';

test('parses circled measurement headers and multiple size rows', () => {
  assert.deepEqual(
    parseSizeGuideText(
      '사이즈 (cm) ① 허리단면 ② 밑위 ③ 총장 S 32 26 96 M 34 26.5 97',
      ['S(모델착용)', 'M'],
    ),
    {
      columns: ['허리단면', '밑위', '총장'],
      rows: [
        { size: 'S', values: ['32', '26', '96'] },
        { size: 'M', values: ['34', '26.5', '97'] },
      ],
      unit: 'cm',
    },
  );
});

test('parses a semantic flat table and front/back length as one cell', () => {
  assert.deepEqual(
    parseSizeGuideText(
      '사이즈 어깨 가슴 총장 FREE 38cm 51cm (앞)71cm (뒤)73cm',
      ['FREE(55-66)'],
    ),
    {
      columns: ['어깨', '가슴', '총장'],
      rows: [
        {
          size: 'FREE',
          values: ['38cm', '51cm', '(앞)71cm / (뒤)73cm'],
        },
      ],
      unit: null,
    },
  );
});

test('rejects unrelated conversion charts, descriptions, and malformed rows', () => {
  assert.equal(
    parseSizeGuideText('US EU 4 6 8 ASIA 100 110 여아 키 (cm) 99-106', ['S']),
    null,
  );
  assert.equal(
    parseSizeGuideText('MD comment 여유 있는 실루엣과 긴 총장 안내', ['FREE']),
    null,
  );
  assert.equal(
    parseSizeGuideText('사이즈 (cm) ① 허리 ② 총장 S 32', ['S']),
    null,
  );
});
