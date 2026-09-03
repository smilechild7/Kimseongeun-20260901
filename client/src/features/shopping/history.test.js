import assert from 'node:assert/strict';
import test from 'node:test';

import { previousAssistantResponses } from './history.js';

function recommendation(responseId) {
  return {
    role: 'assistant',
    kind: 'recommendation',
    data: { responseId, products: [] },
  };
}

test('returns every earlier assistant response in conversation order', () => {
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
    previousAssistantResponses(messages).map(({ message }) => message),
    [first, messages[1], second],
  );
});

test('includes the latest assistant response while a refinement is loading', () => {
  const first = recommendation('resp_first');
  const latest = recommendation('resp_latest');

  assert.deepEqual(
    previousAssistantResponses([first, latest], { includeLatest: true }).map(({ key }) => key),
    ['resp_first', 'resp_latest'],
  );
});

test('keeps an earlier recommendation but excludes the current clarification', () => {
  const result = recommendation('resp_result');
  const clarification = {
    role: 'assistant',
    kind: 'clarification',
    data: { responseId: 'resp_question' },
  };

  assert.deepEqual(
    previousAssistantResponses([result, clarification]).map(({ key }) => key),
    ['resp_result'],
  );
});

test('pairs each assistant response with its preceding user message', () => {
  const firstQuestion = { role: 'user', content: '검정 바지를 찾아줘' };
  const firstResult = recommendation('resp_first');
  const secondQuestion = { role: 'user', content: '조금 더 저렴한 걸로' };
  const secondResult = recommendation('resp_second');

  assert.deepEqual(
    previousAssistantResponses(
      [firstQuestion, firstResult, secondQuestion, secondResult],
      { includeLatest: true },
    ).map(({ userMessage }) => userMessage),
    [firstQuestion, secondQuestion],
  );
});

test('preserves a no-result response in conversation history', () => {
  const question = { role: 'user', content: '3만원 이하 코트' };
  const noResult = {
    role: 'assistant',
    kind: 'no_result',
    data: { responseId: 'resp_empty', message: '조건에 맞는 상품이 없어요.' },
  };
  const nextQuestion = { role: 'user', content: '가격을 넓혀줘' };
  const current = recommendation('resp_current');

  assert.deepEqual(
    previousAssistantResponses([question, noResult, nextQuestion, current]),
    [{ key: 'resp_empty', message: noResult, userMessage: question }],
  );
});
