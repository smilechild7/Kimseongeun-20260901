import { CONTROLLED_VOCABULARY } from '../config/vocabulary.js';

export const EVIDENCE_TYPES = Object.freeze([
  'category',
  'price',
  'color',
  'size',
  'style',
  'occasion',
  'fit',
  'season',
  'review_appearance_match',
  'review_size_fit',
  'review_material_quality',
]);

export const EVIDENCE_VALUE_ENUMS = Object.freeze({
  category: CONTROLLED_VOCABULARY.productCategories,
  price: Object.freeze(['within_required_range']),
  style: CONTROLLED_VOCABULARY.styleTags,
  occasion: CONTROLLED_VOCABULARY.occasionTags,
  fit: CONTROLLED_VOCABULARY.fitTags,
  season: CONTROLLED_VOCABULARY.seasonTags,
  review_appearance_match: Object.freeze(['similar', 'different', 'mixed']),
  review_size_fit: Object.freeze([
    'runs_small',
    'true_to_size',
    'runs_large',
    'mixed',
  ]),
  review_material_quality: Object.freeze(['positive', 'negative', 'mixed']),
});

function evidenceVariant(type, valueSchema) {
  return {
    type: 'object',
    properties: {
      type: { type: 'string', enum: [type] },
      value: valueSchema,
    },
    required: ['type', 'value'],
    additionalProperties: false,
  };
}

const EVIDENCE_ITEM_SCHEMA = {
  anyOf: [
    ...Object.entries(EVIDENCE_VALUE_ENUMS).map(([type, values]) =>
      evidenceVariant(type, { type: 'string', enum: values }),
    ),
    evidenceVariant('color', { type: 'string', minLength: 1, maxLength: 200 }),
    evidenceVariant('size', { type: 'string', minLength: 1, maxLength: 200 }),
  ],
};

const stringArraySchema = {
  type: 'array',
  items: { type: 'string', minLength: 1, maxLength: 300 },
  minItems: 1,
  maxItems: 8,
};

export const AGENT_OUTPUT_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['clarification', 'recommendation', 'no_result'],
    },
    message: { type: 'string', minLength: 1, maxLength: 500 },
    suggestion: { type: ['string', 'null'], maxLength: 500 },
    recommendations: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string', minLength: 1, maxLength: 200 },
          reason: { type: 'string', minLength: 1, maxLength: 500 },
          evidence: {
            type: 'array',
            minItems: 1,
            maxItems: 8,
            items: EVIDENCE_ITEM_SCHEMA,
          },
          strengths: stringArraySchema,
          concerns: stringArraySchema,
        },
        required: [
          'productId',
          'reason',
          'evidence',
          'strengths',
          'concerns',
        ],
        additionalProperties: false,
      },
    },
    comparison: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string', minLength: 1, maxLength: 200 },
          bestFor: { type: 'string', minLength: 1, maxLength: 300 },
          tradeoff: { type: 'string', minLength: 1, maxLength: 300 },
        },
        required: ['productId', 'bestFor', 'tradeoff'],
        additionalProperties: false,
      },
    },
  },
  required: ['type', 'message', 'suggestion', 'recommendations', 'comparison'],
  additionalProperties: false,
});

function assertPlainObject(value, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
}

function assertExactKeys(value, expectedKeys, path) {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${path} has unexpected or missing fields`);
  }
}

function assertNonEmptyString(value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function assertStringArray(value, path) {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  for (const [index, item] of value.entries()) {
    assertNonEmptyString(item, `${path}[${index}]`);
  }
}

function validateRecommendation(value, index) {
  const path = `agent.recommendations[${index}]`;
  assertPlainObject(value, path);
  assertExactKeys(
    value,
    ['productId', 'reason', 'evidence', 'strengths', 'concerns'],
    path,
  );
  assertNonEmptyString(value.productId, `${path}.productId`);
  assertNonEmptyString(value.reason, `${path}.reason`);
  if (!Array.isArray(value.evidence)) {
    throw new Error(`${path}.evidence must be an array`);
  }
  if (value.evidence.length === 0) {
    throw new Error(`${path}.evidence must contain at least one item`);
  }
  for (const [evidenceIndex, evidence] of value.evidence.entries()) {
    const evidencePath = `${path}.evidence[${evidenceIndex}]`;
    assertPlainObject(evidence, evidencePath);
    assertExactKeys(evidence, ['type', 'value'], evidencePath);
    if (!EVIDENCE_TYPES.includes(evidence.type)) {
      throw new Error(`${evidencePath}.type is invalid`);
    }
    assertNonEmptyString(evidence.value, `${evidencePath}.value`);
    const allowedValues = EVIDENCE_VALUE_ENUMS[evidence.type];
    if (allowedValues && !allowedValues.includes(evidence.value)) {
      throw new Error(`${evidencePath}.value is invalid for ${evidence.type}`);
    }
  }
  assertStringArray(value.strengths, `${path}.strengths`);
  assertStringArray(value.concerns, `${path}.concerns`);
  if (value.strengths.length === 0 || value.concerns.length === 0) {
    throw new Error(`${path} strengths and concerns must not be empty`);
  }
}

export function validateAgentOutput(value) {
  assertPlainObject(value, 'agent');
  assertExactKeys(
    value,
    ['type', 'message', 'suggestion', 'recommendations', 'comparison'],
    'agent',
  );
  if (!['clarification', 'recommendation', 'no_result'].includes(value.type)) {
    throw new Error('agent.type is invalid');
  }
  assertNonEmptyString(value.message, 'agent.message');
  if (value.suggestion !== null) {
    assertNonEmptyString(value.suggestion, 'agent.suggestion');
  }
  if (!Array.isArray(value.recommendations) || value.recommendations.length > 3) {
    throw new Error('agent.recommendations must contain at most 3 items');
  }
  value.recommendations.forEach(validateRecommendation);

  const recommendationIds = value.recommendations.map(({ productId }) => productId);
  if (new Set(recommendationIds).size !== recommendationIds.length) {
    throw new Error('agent.recommendations contains duplicate product IDs');
  }

  if (!Array.isArray(value.comparison) || value.comparison.length > 3) {
    throw new Error('agent.comparison must contain at most 3 items');
  }
  for (const [index, comparison] of value.comparison.entries()) {
    const path = `agent.comparison[${index}]`;
    assertPlainObject(comparison, path);
    assertExactKeys(comparison, ['productId', 'bestFor', 'tradeoff'], path);
    assertNonEmptyString(comparison.productId, `${path}.productId`);
    assertNonEmptyString(comparison.bestFor, `${path}.bestFor`);
    assertNonEmptyString(comparison.tradeoff, `${path}.tradeoff`);
  }

  const comparisonIds = value.comparison.map(({ productId }) => productId);
  if (new Set(comparisonIds).size !== comparisonIds.length) {
    throw new Error('agent.comparison contains duplicate product IDs');
  }

  if (value.type === 'recommendation') {
    if (value.recommendations.length === 0) {
      throw new Error('recommendation response requires at least one product');
    }
    if (value.suggestion !== null) {
      throw new Error('recommendation response suggestion must be null');
    }
    if (value.recommendations.length === 1 && value.comparison.length !== 0) {
      throw new Error('single recommendation response must have empty comparison');
    }
    if (
      value.recommendations.length > 1 &&
      (value.comparison.length !== value.recommendations.length ||
        comparisonIds.some((productId) => !recommendationIds.includes(productId)))
    ) {
      throw new Error('comparison must contain each recommended product exactly once');
    }
  } else {
    if (value.recommendations.length !== 0 || value.comparison.length !== 0) {
      throw new Error(`${value.type} response cannot contain products or comparison`);
    }
    if (value.type === 'clarification' && value.suggestion !== null) {
      throw new Error('clarification response suggestion must be null');
    }
    if (value.type === 'no_result' && value.suggestion === null) {
      throw new Error('no_result response requires a suggestion');
    }
  }

  return value;
}
