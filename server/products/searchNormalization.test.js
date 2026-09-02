import assert from 'node:assert/strict';
import test from 'node:test';

import {
  colorsMatch,
  passesConditionalRequired,
  sizesMatch,
} from './searchNormalization.js';

test('matches English/Korean color aliases without broadening charcoal to black', () => {
  assert.equal(colorsMatch('black', '검정'), true);
  assert.equal(colorsMatch('블랙청', 'black'), true);
  assert.equal(colorsMatch('gray', '회색톤'), true);
  assert.equal(colorsMatch('차콜', 'black'), false);
  assert.equal(colorsMatch('베이지카키', 'khaki'), true);
});

test('matches size labels and numeric ranges', () => {
  assert.equal(sizesMatch('M(27~28)', 'M'), true);
  assert.equal(sizesMatch('Free(26~28)', '28'), true);
  assert.equal(sizesMatch('FREE(55-66)', '66'), true);
  assert.equal(sizesMatch('XL(32~34)', '32'), true);
  assert.equal(sizesMatch('M(27~29)', '32'), false);
  assert.equal(sizesMatch('XL(32~34)', 'L'), false);
});

test('keeps missing factual values but rejects known required mismatches', () => {
  assert.equal(passesConditionalRequired([], ['black'], colorsMatch), true);
  assert.equal(
    passesConditionalRequired(['네이비'], ['black'], colorsMatch),
    false,
  );
  assert.equal(
    passesConditionalRequired(['검정'], ['black'], colorsMatch),
    true,
  );
});
