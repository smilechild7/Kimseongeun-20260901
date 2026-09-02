import assert from 'node:assert/strict';
import test from 'node:test';

import { inspectAgent, parseArguments } from './inspectAgent.js';

test('parses fixed Agent cases and custom conversation state', () => {
  assert.deepEqual(parseArguments([]), {
    caseId: 'office-black',
    message: null,
    previousResponseId: null,
  });
  assert.deepEqual(
    parseArguments(['--case=vague', '--previous-response-id=resp_abc']),
    {
      caseId: 'vague',
      message: null,
      previousResponseId: 'resp_abc',
    },
  );
  assert.throws(() => parseArguments(['--case=missing']), /Unknown case/u);
});

test('runs an inspection with an injected mock runtime and closes it', async () => {
  let closed = false;
  const result = await inspectAgent({
    options: parseArguments(['--case=vague']),
    runtime: {
      async chat(input) {
        return { type: 'clarification', message: input.message };
      },
      close() {
        closed = true;
      },
    },
  });

  assert.equal(result.type, 'clarification');
  assert.equal(result.message, '예쁜 옷 추천해줘');
  assert.equal(closed, true);
});
