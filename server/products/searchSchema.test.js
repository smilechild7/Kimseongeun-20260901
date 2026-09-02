import assert from 'node:assert/strict';
import test from 'node:test';

import { SEARCH_PRODUCTS_INPUT_SCHEMA } from './searchSchema.js';

function assertStrictObjects(schema, path = 'root') {
  if (schema.type === 'object') {
    assert.equal(schema.additionalProperties, false, `${path} must be strict`);
    assert.deepEqual(
      [...schema.required].sort(),
      Object.keys(schema.properties).sort(),
      `${path} must require every field`,
    );
    for (const [field, value] of Object.entries(schema.properties)) {
      assertStrictObjects(value, `${path}.${field}`);
    }
  }
  if (schema.type === 'array') {
    assertStrictObjects(schema.items, `${path}[]`);
  }
}

test('defines a strict function-call schema with controlled tag vocabulary', () => {
  assertStrictObjects(SEARCH_PRODUCTS_INPUT_SCHEMA);
  assert.equal(
    SEARCH_PRODUCTS_INPUT_SCHEMA.properties.preferred.properties.fitTags.items.enum.includes(
      'relaxed',
    ),
    true,
  );
  assert.equal(
    SEARCH_PRODUCTS_INPUT_SCHEMA.properties.preferred.properties.reviewSignals.properties
      .sizeFit.enum.includes('true_to_size'),
    true,
  );
});
