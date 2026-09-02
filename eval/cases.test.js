import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const RESPONSE_TYPES = new Set([
  'clarification',
  'recommendation',
  'no_result',
]);

function assertCase(value, ids, path) {
  assert.equal(typeof value.id, 'string', `${path}.id`);
  assert.equal(typeof value.query, 'string', `${path}.query`);
  assert.equal(ids.has(value.id), false, `duplicate eval ID: ${value.id}`);
  ids.add(value.id);
  assert.equal(
    RESPONSE_TYPES.has(value.expectedType),
    true,
    `${path}.expectedType`,
  );
  assert.equal(
    Boolean(
      value.must || value.semanticExpectations || value.reviewExpectation,
    ),
    true,
    `${path} requires an explicit expectation`,
  );
}

test('evaluation cases define seven base requests and one follow-up', async () => {
  const cases = JSON.parse(
    await readFile(new URL('./cases.json', import.meta.url), 'utf8'),
  );
  const ids = new Set();

  assert.equal(cases.length, 7);
  for (const [index, value] of cases.entries()) {
    assertCase(value, ids, `cases[${index}]`);
    if (value.followUp) {
      assertCase(value.followUp, ids, `cases[${index}].followUp`);
      assert.equal(value.expectedType, 'recommendation');
    }
  }
  assert.equal(cases.filter(({ followUp }) => followUp).length, 1);
  assert.equal(ids.size, 8);
});
