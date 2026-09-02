import { CONTROLLED_VOCABULARY } from '../config/vocabulary.js';

const stringArray = (values) => ({
  type: 'array',
  items: values ? { type: 'string', enum: values } : { type: 'string' },
});

const nullableSignal = (values) => ({
  type: ['string', 'null'],
  enum: [...values, null],
});

export const SEARCH_PRODUCTS_INPUT_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    query: { type: 'string' },
    required: {
      type: 'object',
      properties: {
        category: { type: ['string', 'null'] },
        minPrice: { type: ['integer', 'null'], minimum: 0 },
        maxPrice: { type: ['integer', 'null'], minimum: 0 },
        colors: stringArray(),
        sizes: stringArray(),
      },
      required: ['category', 'minPrice', 'maxPrice', 'colors', 'sizes'],
      additionalProperties: false,
    },
    preferred: {
      type: 'object',
      properties: {
        colors: stringArray(),
        sizes: stringArray(),
        styleTags: stringArray(CONTROLLED_VOCABULARY.styleTags),
        occasionTags: stringArray(CONTROLLED_VOCABULARY.occasionTags),
        fitTags: stringArray(CONTROLLED_VOCABULARY.fitTags),
        seasonTags: stringArray(CONTROLLED_VOCABULARY.seasonTags),
        keywords: stringArray(),
        avoidKeywords: stringArray(),
        reviewSignals: {
          type: 'object',
          properties: {
            appearanceMatch: nullableSignal([
              'similar',
              'different',
              'mixed',
              'unknown',
            ]),
            sizeFit: nullableSignal([
              'runs_small',
              'true_to_size',
              'runs_large',
              'mixed',
              'unknown',
            ]),
            materialQuality: nullableSignal([
              'positive',
              'negative',
              'mixed',
              'unknown',
            ]),
          },
          required: ['appearanceMatch', 'sizeFit', 'materialQuality'],
          additionalProperties: false,
        },
      },
      required: [
        'colors',
        'sizes',
        'styleTags',
        'occasionTags',
        'fitTags',
        'seasonTags',
        'keywords',
        'avoidKeywords',
        'reviewSignals',
      ],
      additionalProperties: false,
    },
  },
  required: ['query', 'required', 'preferred'],
  additionalProperties: false,
});
