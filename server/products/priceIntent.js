const MAN_WON = 10_000;
const PRICE_PATTERN = /(?:(\d+(?:\.\d+)?)\s*만\s*원|(\d{1,3}(?:,\d{3})+|\d{4,})\s*원)/gu;
const EXPLICIT_PREFIX_PATTERN = /(?:최대|최소|예산|상한|하한|정확히|딱)(?:은|는|이|가)?(?:\s*가격)?\s*(?:=|:)?\s*$/u;
const EXPLICIT_SUFFIX_PATTERN = /^\s*(?:이하|이내|미만|아래|까지|이상|초과|부터|대|만(?:으로)?|에서)/u;
const RANGE_BEFORE_PATTERN = /\d+(?:\.\d+)?\s*(?:만\s*원)?\s*(?:~|〜|-|–|—|에서)\s*$/u;
const RANGE_AFTER_PATTERN = /^\s*(?:~|〜|-|–|—|에서)\s*\d/u;

function wonAmount(match) {
  const amount = match[1]
    ? Number(match[1]) * MAN_WON
    : Number(match[2].replaceAll(',', ''));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function hasExplicitBoundary(query, match) {
  const before = query.slice(Math.max(0, match.index - 24), match.index);
  const after = query.slice(match.index + match[0].length, match.index + match[0].length + 16);
  return (
    EXPLICIT_PREFIX_PATTERN.test(before) ||
    EXPLICIT_SUFFIX_PATTERN.test(after) ||
    RANGE_BEFORE_PATTERN.test(before) ||
    RANGE_AFTER_PATTERN.test(after)
  );
}

function roundedRange(targetPrice) {
  const target = BigInt(targetPrice);
  const roundingUnit = BigInt(MAN_WON);
  const ratioUnit = 10n * roundingUnit;
  const minPrice = ((target * 9n) / ratioUnit) * roundingUnit;
  const maxPrice = ((target * 11n + ratioUnit - 1n) / ratioUnit) * roundingUnit;
  if (maxPrice > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return { minPrice: Number(minPrice), maxPrice: Number(maxPrice) };
}

function priceBandRange(targetPrice, query, match) {
  const suffix = query.slice(match.index + match[0].length).trimStart();
  if (!suffix.startsWith('대') || /^대\s*(?:이하|이상|미만|초과)/u.test(suffix)) {
    return null;
  }
  if (targetPrice % MAN_WON !== 0 || targetPrice > Number.MAX_SAFE_INTEGER - MAN_WON) {
    return null;
  }
  return { minPrice: targetPrice, maxPrice: targetPrice + MAN_WON - 1 };
}

export function interpretedPriceRange(query) {
  if (typeof query !== 'string') return null;
  const matches = [...query.matchAll(PRICE_PATTERN)];
  if (matches.length !== 1) return null;

  const targetPrice = wonAmount(matches[0]);
  if (targetPrice === null) return null;
  const priceBand = priceBandRange(targetPrice, query, matches[0]);
  if (priceBand) return priceBand;
  if (hasExplicitBoundary(query, matches[0])) return null;

  return roundedRange(targetPrice);
}

export function applyPriceIntent(input, query) {
  const range = interpretedPriceRange(query);
  if (!range) return input;
  return {
    ...input,
    required: {
      ...input.required,
      ...range,
    },
  };
}
