import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from './app.js';

async function withServer(app, callback) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function chatResult(message) {
  return {
    type: 'clarification',
    responseId: 'resp_test',
    message,
  };
}

test('validates chat input and does not send invalid requests to the Agent', async () => {
  let calls = 0;
  const app = createApp({
    chat: async ({ message }) => {
      calls += 1;
      return chatResult(message);
    },
  });

  await withServer(app, async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });
    assert.equal(invalid.status, 400);

    const valid = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '검정 바지' }),
    });
    assert.equal(valid.status, 200);
    assert.equal((await valid.json()).message, '검정 바지');
    assert.equal(calls, 1);
  });
});

test('limits one client independently from the service-wide budget', async () => {
  const app = createApp({
    chat: async () => chatResult('ok'),
    rateLimitConfig: {
      client: { windowMs: 60_000, limit: 2 },
      service: { windowMs: 60_000, limit: 100 },
    },
  });

  await withServer(app, async (baseUrl) => {
    for (let index = 0; index < 2; index += 1) {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({ message: '검정 바지' }),
      });
      assert.equal(response.status, 200);
    }

    const limited = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify({ message: '검정 바지' }),
    });
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).scope, 'client');
  });
});

test('limits distributed client IPs with the service-wide budget', async () => {
  const app = createApp({
    chat: async () => chatResult('ok'),
    rateLimitConfig: {
      client: { windowMs: 60_000, limit: 100 },
      service: { windowMs: 60_000, limit: 2 },
    },
  });

  await withServer(app, async (baseUrl) => {
    for (let index = 1; index <= 3; index += 1) {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': `203.0.113.${index}`,
        },
        body: JSON.stringify({ message: '검정 바지' }),
      });
      assert.equal(response.status, index < 3 ? 200 : 429);
      if (index === 3) {
        assert.equal((await response.json()).scope, 'service');
      }
    }
  });
});

test('rejects oversized JSON before calling the Agent', async () => {
  let calls = 0;
  const app = createApp({
    chat: async () => {
      calls += 1;
      return chatResult('ok');
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '가'.repeat(20_000) }),
    });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error, 'request_too_large');
    assert.equal(calls, 0);
  });
});
