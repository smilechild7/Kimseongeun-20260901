import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGENT_OUTPUT_SCHEMA,
  EVIDENCE_VALUE_ENUMS,
  validateAgentOutput,
} from './outputContract.js';

function recommendation(productId) {
  return {
    productId,
    reason: '출근 조건에 맞습니다.',
    evidence: [{ type: 'occasion', value: 'office' }],
    strengths: ['출근용 태그가 있습니다.'],
    concerns: ['사이즈는 실측 확인이 필요합니다.'],
  };
}

test('accepts one recommendation only with an empty comparison', () => {
  const value = {
    type: 'recommendation',
    message: '한 개를 골랐어요.',
    suggestion: null,
    recommendations: [recommendation('shop:1')],
    comparison: [],
  };

  assert.equal(validateAgentOutput(value), value);
});

test('requires comparison entries to exactly cover multiple recommendations', () => {
  assert.throws(
    () =>
      validateAgentOutput({
        type: 'recommendation',
        message: '두 개를 골랐어요.',
        suggestion: null,
        recommendations: [recommendation('shop:1'), recommendation('shop:2')],
        comparison: [
          { productId: 'shop:1', bestFor: '핏', tradeoff: '리뷰 부족' },
        ],
      }),
    /comparison/u,
  );
});

test('enforces empty product arrays for clarification and suggestion for no result', () => {
  assert.throws(
    () =>
      validateAgentOutput({
        type: 'clarification',
        message: '어떤 옷인가요?',
        suggestion: null,
        recommendations: [recommendation('shop:1')],
        comparison: [],
      }),
    /cannot contain/u,
  );
  assert.throws(
    () =>
      validateAgentOutput({
        type: 'no_result',
        message: '없어요.',
        suggestion: null,
        recommendations: [],
        comparison: [],
      }),
    /requires a suggestion/u,
  );
});

test('uses type-specific nested anyOf evidence schemas without unknown review signals', () => {
  const evidenceSchema =
    AGENT_OUTPUT_SCHEMA.properties.recommendations.items.properties.evidence.items;

  assert.equal(Array.isArray(evidenceSchema.anyOf), true);
  assert.equal(evidenceSchema.anyOf.length, 11);
  for (const variant of evidenceSchema.anyOf) {
    assert.deepEqual(variant.required, ['type', 'value']);
    assert.equal(variant.additionalProperties, false);
    assert.equal(variant.properties.type.enum.length, 1);
  }
  assert.equal(
    Object.values(EVIDENCE_VALUE_ENUMS).some((values) => values.includes('unknown')),
    false,
  );
});

test('rejects a value outside the evidence type vocabulary', () => {
  const value = {
    type: 'recommendation',
    message: '한 개를 골랐어요.',
    suggestion: null,
    recommendations: [recommendation('shop:1')],
    comparison: [],
  };
  value.recommendations[0].evidence = [
    { type: 'review_appearance_match', value: 'unknown' },
  ];

  assert.throws(() => validateAgentOutput(value), /value is invalid/u);
});
