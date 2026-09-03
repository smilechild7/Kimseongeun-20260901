import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ChatApiError,
  chatErrorMessage,
  isRecoverableChatError,
  postChat,
} from './api.js';

function mockResponse({ ok, status, body, retryAfter = null }) {
  return {
    ok,
    status,
    headers: { get: () => retryAfter },
    async json() {
      return body;
    },
  };
}

test('posts the existing chat contract with conversation state', async () => {
  let request;
  const result = await postChat({
    message: '검정 바지',
    previousResponseId: 'resp_previous',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return mockResponse({
        ok: true,
        status: 200,
        body: { type: 'clarification', responseId: 'resp_next', message: '사이즈는요?' },
      });
    },
  });

  assert.equal(request.url, '/api/chat');
  assert.deepEqual(JSON.parse(request.options.body), {
    message: '검정 바지',
    previousResponseId: 'resp_previous',
  });
  assert.equal(result.responseId, 'resp_next');
});

test('exposes rate-limit retry time and a Korean user message', async () => {
  await assert.rejects(
    postChat({
      message: '검정 바지',
      fetchImpl: async () =>
        mockResponse({
          ok: false,
          status: 429,
          body: { error: 'rate_limit_exceeded', retryAfterSeconds: 42 },
        }),
    }),
    (error) => {
      assert.equal(error instanceof ChatApiError, true);
      assert.equal(error.retryAfterSeconds, 42);
      assert.match(chatErrorMessage(error), /42초/u);
      return true;
    },
  );
});

test('only marks invalid Agent responses as conversationally recoverable', () => {
  assert.equal(
    isRecoverableChatError(
      new ChatApiError('invalid', { code: 'agent_response_invalid' }),
    ),
    true,
  );
  assert.equal(
    isRecoverableChatError(
      new ChatApiError('unexpected type', { code: 'invalid_response' }),
    ),
    true,
  );
  assert.equal(
    isRecoverableChatError(new ChatApiError('timeout', { code: 'agent_timeout' })),
    false,
  );
  assert.equal(
    isRecoverableChatError(
      new ChatApiError('network', { code: 'network_error' }),
    ),
    false,
  );
});
