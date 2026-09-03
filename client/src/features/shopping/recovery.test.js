import assert from 'node:assert/strict';
import test from 'node:test';

import { recoveryQuestion } from './recovery.js';

test('asks for one category after a failed category clarification', () => {
  assert.match(
    recoveryQuestion({
      kind: 'clarification',
      data: { message: '원피스, 상의, 바지, 스커트, 아우터 중 하나를 알려주세요.' },
    }),
    /먼저 찾을 한 가지/u,
  );
});

test('uses a general retry question outside category clarification', () => {
  assert.match(recoveryQuestion(null), /옷 종류와 가장 중요한 조건/u);
});
