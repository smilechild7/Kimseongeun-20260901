import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInitialShoppingState,
  shoppingReducer,
} from './reducer.js';

test('moves from submit to recommendation while preserving messages and response ID', () => {
  const sent = shoppingReducer(createInitialShoppingState(), {
    type: 'SEND_MESSAGE',
    payload: { displayMessage: '검정 바지' },
  });
  assert.equal(sent.status, 'loading');
  assert.equal(sent.messages[0].content, '검정 바지');

  const received = shoppingReducer(sent, {
    type: 'RECEIVE_RECOMMENDATION',
    payload: {
      type: 'recommendation',
      responseId: 'resp_next',
      products: [],
    },
  });
  assert.equal(received.status, 'ready');
  assert.equal(received.previousResponseId, 'resp_next');
  assert.equal(received.messages.at(-1).kind, 'recommendation');
});

test('records a request error and resets all conversation state', () => {
  const failed = shoppingReducer(createInitialShoppingState('resp_old'), {
    type: 'REQUEST_FAILED',
    payload: '실패',
  });
  assert.equal(failed.error, '실패');
  assert.deepEqual(
    shoppingReducer(failed, { type: 'RESET_CONVERSATION' }),
    createInitialShoppingState(),
  );
});

test('adds a recovery clarification while preserving conversation state', () => {
  const sent = shoppingReducer(createInitialShoppingState('resp_old'), {
    type: 'SEND_MESSAGE',
    payload: { displayMessage: '아우터랑 바지' },
  });
  const recovered = shoppingReducer(sent, {
    type: 'RECEIVE_RECOVERY_CLARIFICATION',
    payload: { message: '먼저 찾을 한 가지를 골라주세요.' },
  });

  assert.equal(recovered.status, 'ready');
  assert.equal(recovered.previousResponseId, 'resp_old');
  assert.equal(recovered.error, null);
  assert.deepEqual(recovered.messages.at(-1), {
    role: 'assistant',
    kind: 'clarification',
    data: {
      type: 'clarification',
      message: '먼저 찾을 한 가지를 골라주세요.',
      recovery: true,
    },
  });
});
