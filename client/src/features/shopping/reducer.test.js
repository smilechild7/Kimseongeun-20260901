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
