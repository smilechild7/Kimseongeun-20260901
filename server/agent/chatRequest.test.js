import assert from 'node:assert/strict';
import test from 'node:test';

import { validateChatRequest } from './chatRequest.js';

const options = { maxMessageLength: 10 };

test('normalizes a valid chat request without persisting extra state', () => {
  assert.deepEqual(
    validateChatRequest(
      { message: '  검정 바지  ', previousResponseId: 'resp_abc-123' },
      options,
    ),
    { message: '검정 바지', previousResponseId: 'resp_abc-123' },
  );
});

test('rejects invalid message, response ID, and unknown fields', () => {
  assert.throws(() => validateChatRequest({ message: ' ' }, options), /1-10/u);
  assert.throws(
    () => validateChatRequest({ message: '검정 바지', previousResponseId: 'bad' }, options),
    /previousResponseId/u,
  );
  assert.throws(
    () => validateChatRequest({ message: '검정 바지', userId: '1' }, options),
    /unsupported/u,
  );
});
