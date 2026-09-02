import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('evaluation cases have unique IDs and explicit expectations', async () => {
  const cases = JSON.parse(
    await readFile(new URL('./cases.json', import.meta.url), 'utf8'),
  );
  const ids = new Set();

  assert.equal(cases.length >= 4, true);
  for (const value of cases) {
    assert.equal(typeof value.id, 'string');
    assert.equal(typeof value.query, 'string');
    assert.equal(ids.has(value.id), false, `duplicate eval ID: ${value.id}`);
    ids.add(value.id);
    assert.equal(
      Boolean(
        value.must || value.semanticExpectations || value.reviewExpectation,
      ),
      true,
    );
  }
});
