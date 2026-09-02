import { RETRIEVAL_CONFIG } from '../config/retrieval.js';
import {
  colorsMatch,
  matchesAnyValue,
  normalizeText,
  sizesMatch,
} from './searchNormalization.js';

function normalizedIncludes(values, expected) {
  const normalizedExpected = normalizeText(expected);
  return values.some((value) => normalizeText(value) === normalizedExpected);
}

function countMatches(expectedValues, actualValues) {
  return expectedValues.reduce(
    (count, expected) => count + Number(normalizedIncludes(actualValues, expected)),
    0,
  );
}

function keywordHaystack(product, enrichment) {
  return normalizeText(
    [
      product.name,
      product.brand,
      product.category,
      product.material,
      product.description,
      ...(product.colors ?? []),
      ...(product.sizes ?? []),
      enrichment?.summary,
      ...(enrichment?.styleTags ?? []),
      ...(enrichment?.occasionTags ?? []),
      ...(enrichment?.fitTags ?? []),
      ...(enrichment?.seasonTags ?? []),
      ...(enrichment?.extraTags ?? []),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function keywordMatchCount(keywords, haystack) {
  return keywords.reduce((count, keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    return count + Number(normalizedKeyword !== '' && haystack.includes(normalizedKeyword));
  }, 0);
}

export function scoreSearchCandidate(
  candidate,
  preferred,
  config = RETRIEVAL_CONFIG,
) {
  const { product, enrichment } = candidate;
  const weights = config.weights;
  const haystack = keywordHaystack(product, enrichment);
  const reviewSummary = enrichment?.reviewSummary;

  const breakdown = {
    keyword:
      keywordMatchCount(preferred.keywords, haystack) * weights.keyword -
      keywordMatchCount(preferred.avoidKeywords, haystack) * weights.keyword,
    color: matchesAnyValue(product.colors ?? [], preferred.colors, colorsMatch)
      ? weights.color
      : 0,
    size: matchesAnyValue(product.sizes ?? [], preferred.sizes, sizesMatch)
      ? weights.size
      : 0,
    style:
      countMatches(preferred.styleTags, enrichment?.styleTags ?? []) * weights.style,
    occasion:
      countMatches(preferred.occasionTags, enrichment?.occasionTags ?? []) *
      weights.occasion,
    fit: countMatches(preferred.fitTags, enrichment?.fitTags ?? []) * weights.fit,
    season:
      countMatches(preferred.seasonTags, enrichment?.seasonTags ?? []) * weights.season,
    reviewSignal: 0,
  };

  for (const [field, expectedSignal] of Object.entries(preferred.reviewSignals)) {
    if (expectedSignal !== null && reviewSummary?.[field]?.signal === expectedSignal) {
      breakdown.reviewSignal += weights.reviewSignal;
    }
  }

  return {
    total: Object.values(breakdown).reduce((total, value) => total + value, 0),
    breakdown,
  };
}
