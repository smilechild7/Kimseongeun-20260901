import assert from 'node:assert/strict';
import test from 'node:test';

import { previousRecommendations } from './history.js';

function recommendation(responseId) {
  return {
    role: 'assistant',
    kind: 'recommendation',
    data: { responseId, products: [] },
  };
}

test('returns earlier recommendations in newest-first order', () => {
  const first = recommendation('resp_first');
  const second = recommendation('resp_second');
  const latest = recommendation('resp_latest');
  const messages = [
    first,
    { role: 'assistant', kind: 'clarification', data: { responseId: 'resp_question' } },
    second,
    latest,
  ];

  assert.deepEqual(
    previousRecommendations(messages).map(({ message }) => message),
    [second, first],
  );
});

test('includes the latest recommendation while a refinement is loading', () => {
  const first = recommendation('resp_first');
  const latest = recommendation('resp_latest');

  assert.deepEqual(
    previousRecommendations([first, latest], { includeLatest: true }).map(({ key }) => key),
    ['resp_latest', 'resp_first'],
  );
});

test('keeps a recommendation before a latest clarification', () => {
  const result = recommendation('resp_result');
  const clarification = {
    role: 'assistant',
    kind: 'clarification',
    data: { responseId: 'resp_question' },
  };

  assert.deepEqual(
    previousRecommendations([result, clarification]).map(({ key }) => key),
    ['resp_result'],
  );
});
