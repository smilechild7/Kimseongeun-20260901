import { CONTROLLED_VOCABULARY } from '../../server/config/vocabulary.js';

export { CONTROLLED_VOCABULARY };

export const REVIEW_SIGNALS = Object.freeze({
  appearanceMatch: Object.freeze(['similar', 'different', 'mixed', 'unknown']),
  sizeFit: Object.freeze([
    'runs_small',
    'true_to_size',
    'runs_large',
    'mixed',
    'unknown',
  ]),
  materialQuality: Object.freeze(['positive', 'negative', 'mixed', 'unknown']),
});

const stringArraySchema = (values) => ({
  type: 'array',
  items: values ? { type: 'string', enum: values } : { type: 'string' },
});

const signalSchema = (values) => ({
  type: 'object',
  properties: {
    signal: { type: 'string', enum: values },
    summary: { type: 'string' },
  },
  required: ['signal', 'summary'],
  additionalProperties: false,
});

export const ENRICHMENT_OUTPUT_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    summary: { type: 'string' },
    styleTags: stringArraySchema(CONTROLLED_VOCABULARY.styleTags),
    occasionTags: stringArraySchema(CONTROLLED_VOCABULARY.occasionTags),
    fitTags: stringArraySchema(CONTROLLED_VOCABULARY.fitTags),
    seasonTags: stringArraySchema(CONTROLLED_VOCABULARY.seasonTags),
    extraTags: stringArraySchema(),
    reviewSummary: {
      type: 'object',
      properties: {
        analyzedReviewCount: { type: 'integer', minimum: 0 },
        appearanceMatch: signalSchema(REVIEW_SIGNALS.appearanceMatch),
        sizeFit: signalSchema(REVIEW_SIGNALS.sizeFit),
        materialQuality: signalSchema(REVIEW_SIGNALS.materialQuality),
        positives: stringArraySchema(),
        concerns: stringArraySchema(),
        similarReviewerNotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              profile: { type: 'string' },
              note: { type: 'string' },
            },
            required: ['profile', 'note'],
            additionalProperties: false,
          },
        },
      },
      required: [
        'analyzedReviewCount',
        'appearanceMatch',
        'sizeFit',
        'materialQuality',
        'positives',
        'concerns',
        'similarReviewerNotes',
      ],
      additionalProperties: false,
    },
  },
  required: [
    'summary',
    'styleTags',
    'occasionTags',
    'fitTags',
    'seasonTags',
    'extraTags',
    'reviewSummary',
  ],
  additionalProperties: false,
});

const evidenceCountSchema = {
  type: 'integer',
  minimum: 0,
};

export const MODEL_ENRICHMENT_OUTPUT_SCHEMA = Object.freeze({
  ...ENRICHMENT_OUTPUT_SCHEMA,
  properties: {
    ...ENRICHMENT_OUTPUT_SCHEMA.properties,
    evidenceTally: {
      type: 'object',
      properties: {
        appearanceMatch: {
          type: 'object',
          properties: {
            similar: evidenceCountSchema,
            different: evidenceCountSchema,
          },
          required: ['similar', 'different'],
          additionalProperties: false,
        },
        sizeFit: {
          type: 'object',
          properties: {
            runsSmall: evidenceCountSchema,
            trueToSize: evidenceCountSchema,
            runsLarge: evidenceCountSchema,
          },
          required: ['runsSmall', 'trueToSize', 'runsLarge'],
          additionalProperties: false,
        },
        materialQuality: {
          type: 'object',
          properties: {
            positive: evidenceCountSchema,
            negative: evidenceCountSchema,
          },
          required: ['positive', 'negative'],
          additionalProperties: false,
        },
      },
      required: ['appearanceMatch', 'sizeFit', 'materialQuality'],
      additionalProperties: false,
    },
  },
  required: [...ENRICHMENT_OUTPUT_SCHEMA.required, 'evidenceTally'],
});

function assertPlainObject(value, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
}

function assertExactKeys(value, expectedKeys, path) {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(sortedExpectedKeys)) {
    throw new Error(`${path} has unexpected or missing fields`);
  }
}

function assertString(value, path) {
  if (typeof value !== 'string') {
    throw new Error(`${path} must be a string`);
  }
}

function assertStringArray(value, path, allowedValues) {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  for (const [index, item] of value.entries()) {
    assertString(item, `${path}[${index}]`);
    if (allowedValues && !allowedValues.includes(item)) {
      throw new Error(`${path}[${index}] is outside the controlled vocabulary`);
    }
  }
}

function hasStructuredReviewerProfile(product) {
  return (product.reviews ?? []).some((review) => {
    const profile = review.reviewerProfile;
    return (
      profile &&
      typeof profile === 'object' &&
      Object.values(profile).some((value) => value !== null && value !== '')
    );
  });
}

export function validateEnrichmentOutput(value, product) {
  assertPlainObject(value, 'enrichment');
  assertExactKeys(value, ENRICHMENT_OUTPUT_SCHEMA.required, 'enrichment');
  assertString(value.summary, 'enrichment.summary');

  for (const field of ['styleTags', 'occasionTags', 'fitTags', 'seasonTags']) {
    assertStringArray(value[field], `enrichment.${field}`, CONTROLLED_VOCABULARY[field]);
  }
  assertStringArray(value.extraTags, 'enrichment.extraTags');

  const reviewSummary = value.reviewSummary;
  assertPlainObject(reviewSummary, 'enrichment.reviewSummary');
  assertExactKeys(
    reviewSummary,
    ENRICHMENT_OUTPUT_SCHEMA.properties.reviewSummary.required,
    'enrichment.reviewSummary',
  );

  const expectedReviewCount = product.reviews?.length ?? 0;
  if (reviewSummary.analyzedReviewCount !== expectedReviewCount) {
    throw new Error(
      `analyzedReviewCount must equal supplied review count ${expectedReviewCount}`,
    );
  }

  for (const field of ['appearanceMatch', 'sizeFit', 'materialQuality']) {
    const signalValue = reviewSummary[field];
    assertPlainObject(signalValue, `enrichment.reviewSummary.${field}`);
    assertExactKeys(signalValue, ['signal', 'summary'], `enrichment.reviewSummary.${field}`);
    if (!REVIEW_SIGNALS[field].includes(signalValue.signal)) {
      throw new Error(`enrichment.reviewSummary.${field}.signal is invalid`);
    }
    assertString(signalValue.summary, `enrichment.reviewSummary.${field}.summary`);
  }

  assertStringArray(reviewSummary.positives, 'enrichment.reviewSummary.positives');
  assertStringArray(reviewSummary.concerns, 'enrichment.reviewSummary.concerns');
  if (!Array.isArray(reviewSummary.similarReviewerNotes)) {
    throw new Error('enrichment.reviewSummary.similarReviewerNotes must be an array');
  }
  for (const [index, note] of reviewSummary.similarReviewerNotes.entries()) {
    const path = `enrichment.reviewSummary.similarReviewerNotes[${index}]`;
    assertPlainObject(note, path);
    assertExactKeys(note, ['profile', 'note'], path);
    assertString(note.profile, `${path}.profile`);
    assertString(note.note, `${path}.note`);
  }

  if (!hasStructuredReviewerProfile(product) && reviewSummary.similarReviewerNotes.length > 0) {
    throw new Error('similarReviewerNotes require structured reviewer profile evidence');
  }

  if (expectedReviewCount === 0) {
    for (const field of ['appearanceMatch', 'sizeFit', 'materialQuality']) {
      if (reviewSummary[field].signal !== 'unknown') {
        throw new Error(`${field} must be unknown when no reviews were supplied`);
      }
    }
    if (
      reviewSummary.positives.length > 0 ||
      reviewSummary.concerns.length > 0 ||
      reviewSummary.similarReviewerNotes.length > 0
    ) {
      throw new Error('review evidence arrays must be empty when no reviews were supplied');
    }
  }

  return value;
}

function assertEvidenceTally(tally, fields, reviewCount, path) {
  assertPlainObject(tally, path);
  assertExactKeys(tally, fields, path);
  for (const field of fields) {
    const count = tally[field];
    if (!Number.isSafeInteger(count) || count < 0 || count > reviewCount) {
      throw new Error(`${path}.${field} must be an evidence count within review count`);
    }
  }
}

function appearanceSignal(tally) {
  if (tally.similar > 0 && tally.different > 0) return 'mixed';
  if (tally.similar > 0) return 'similar';
  if (tally.different > 0) return 'different';
  return 'unknown';
}

function sizeSignal(tally) {
  const presentSignals = [
    ['runsSmall', 'runs_small'],
    ['trueToSize', 'true_to_size'],
    ['runsLarge', 'runs_large'],
  ].filter(([field]) => tally[field] > 0);
  if (presentSignals.length === 0) return 'unknown';
  if (presentSignals.length > 1) return 'mixed';
  return presentSignals[0][1];
}

function materialSignal(tally) {
  if (tally.positive > 0 && tally.negative > 0) return 'mixed';
  if (tally.positive > 0) return 'positive';
  if (tally.negative > 0) return 'negative';
  return 'unknown';
}

export function validateModelEnrichmentOutput(value, product) {
  assertPlainObject(value, 'modelEnrichment');
  assertExactKeys(value, MODEL_ENRICHMENT_OUTPUT_SCHEMA.required, 'modelEnrichment');

  const { evidenceTally, ...enrichment } = value;
  assertPlainObject(evidenceTally, 'modelEnrichment.evidenceTally');
  assertExactKeys(
    evidenceTally,
    ['appearanceMatch', 'sizeFit', 'materialQuality'],
    'modelEnrichment.evidenceTally',
  );

  const reviewCount = product.reviews?.length ?? 0;
  assertEvidenceTally(
    evidenceTally.appearanceMatch,
    ['similar', 'different'],
    reviewCount,
    'modelEnrichment.evidenceTally.appearanceMatch',
  );
  assertEvidenceTally(
    evidenceTally.sizeFit,
    ['runsSmall', 'trueToSize', 'runsLarge'],
    reviewCount,
    'modelEnrichment.evidenceTally.sizeFit',
  );
  assertEvidenceTally(
    evidenceTally.materialQuality,
    ['positive', 'negative'],
    reviewCount,
    'modelEnrichment.evidenceTally.materialQuality',
  );

  const expectedSignals = {
    appearanceMatch: appearanceSignal(evidenceTally.appearanceMatch),
    sizeFit: sizeSignal(evidenceTally.sizeFit),
    materialQuality: materialSignal(evidenceTally.materialQuality),
  };
  const normalizedEnrichment = {
    ...enrichment,
    reviewSummary: {
      ...enrichment.reviewSummary,
      appearanceMatch: {
        ...enrichment.reviewSummary.appearanceMatch,
        signal: expectedSignals.appearanceMatch,
      },
      sizeFit: {
        ...enrichment.reviewSummary.sizeFit,
        signal: expectedSignals.sizeFit,
      },
      materialQuality: {
        ...enrichment.reviewSummary.materialQuality,
        signal: expectedSignals.materialQuality,
      },
    },
  };

  return validateEnrichmentOutput(normalizedEnrichment, product);
}
