import { CONTROLLED_VOCABULARY } from '../config/vocabulary.js';

const REVIEW_SIGNALS = Object.freeze({
  appearanceMatch: new Set(['similar', 'different', 'mixed', 'unknown']),
  sizeFit: new Set([
    'runs_small',
    'true_to_size',
    'runs_large',
    'mixed',
    'unknown',
  ]),
  materialQuality: new Set(['positive', 'negative', 'mixed', 'unknown']),
});

function optionalInteger(value, path) {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${path} must be a non-negative integer or null`);
  }
  return value;
}

function stringArray(value, path, allowedValues) {
  if (value === null || value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${path} must be an array of strings`);
  }
  const normalized = [...new Set(value.map((item) => item.trim()).filter(Boolean))];
  if (allowedValues && normalized.some((item) => !allowedValues.includes(item))) {
    throw new Error(`${path} contains a value outside the controlled vocabulary`);
  }
  return normalized;
}

function reviewSignals(value) {
  if (value !== null && value !== undefined && (typeof value !== 'object' || Array.isArray(value))) {
    throw new Error('preferred.reviewSignals must be an object');
  }
  const normalized = {};
  for (const [field, allowedValues] of Object.entries(REVIEW_SIGNALS)) {
    const signal = value?.[field] ?? null;
    if (signal !== null && !allowedValues.has(signal)) {
      throw new Error(`preferred.reviewSignals.${field} is invalid`);
    }
    normalized[field] = signal;
  }
  return normalized;
}

export function normalizeSearchInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('search input must be an object');
  }
  if (typeof value.query !== 'string' || value.query.trim() === '') {
    throw new Error('query must be a non-empty string');
  }

  const required = value.required ?? {};
  const preferred = value.preferred ?? {};
  const minPrice = optionalInteger(required.minPrice, 'required.minPrice');
  const maxPrice = optionalInteger(required.maxPrice, 'required.maxPrice');
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    throw new Error('required.minPrice must not exceed required.maxPrice');
  }
  if (
    required.category !== null &&
    required.category !== undefined &&
    typeof required.category !== 'string'
  ) {
    throw new Error('required.category must be a string or null');
  }

  return {
    query: value.query.trim(),
    required: {
      category: required.category?.trim() || null,
      minPrice,
      maxPrice,
      colors: stringArray(required.colors, 'required.colors'),
      sizes: stringArray(required.sizes, 'required.sizes'),
    },
    preferred: {
      colors: stringArray(preferred.colors, 'preferred.colors'),
      sizes: stringArray(preferred.sizes, 'preferred.sizes'),
      styleTags: stringArray(
        preferred.styleTags,
        'preferred.styleTags',
        CONTROLLED_VOCABULARY.styleTags,
      ),
      occasionTags: stringArray(
        preferred.occasionTags,
        'preferred.occasionTags',
        CONTROLLED_VOCABULARY.occasionTags,
      ),
      fitTags: stringArray(
        preferred.fitTags,
        'preferred.fitTags',
        CONTROLLED_VOCABULARY.fitTags,
      ),
      seasonTags: stringArray(
        preferred.seasonTags,
        'preferred.seasonTags',
        CONTROLLED_VOCABULARY.seasonTags,
      ),
      keywords: stringArray(preferred.keywords, 'preferred.keywords'),
      avoidKeywords: stringArray(
        preferred.avoidKeywords,
        'preferred.avoidKeywords',
      ),
      reviewSignals: reviewSignals(preferred.reviewSignals),
    },
  };
}
