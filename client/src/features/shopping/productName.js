const SQUARE_TAG_PATTERN = /\[[^\]]*\]|【[^】]*】/gu;
const PARENTHETICAL_PATTERN = /\([^)]*\)|（[^）]*）/gu;
const TRAILING_SEPARATOR_PATTERN = /[\s,;/|·-]+$/u;

function removeLongSeoBlock(name) {
  for (const match of name.matchAll(PARENTHETICAL_PATTERN)) {
    const content = match[0].slice(1, -1);
    const hyphenCount = [...content].filter((character) => character === '-').length;
    if (content.length >= 40 || hyphenCount >= 2) {
      return name.slice(0, match.index);
    }
  }

  return name;
}

function removeSeoKeywordSuffix(name) {
  const firstComma = name.indexOf(',');
  if (firstComma === -1) return name;

  const remainingCommaCount = [...name.slice(firstComma + 1)]
    .filter((character) => character === ',')
    .length;

  return remainingCommaCount > 0 ? name.slice(0, firstComma) : name;
}

export function formatProductDisplayName(name, maxLength = 28) {
  const original = String(name ?? '').replace(/\s+/gu, ' ').trim();
  if (!original) return '';

  const withoutSeoBlock = removeLongSeoBlock(original);
  const withoutMarketingTags = withoutSeoBlock
    .replace(SQUARE_TAG_PATTERN, ' ')
    .replace(PARENTHETICAL_PATTERN, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
  const cleaned = removeSeoKeywordSuffix(withoutMarketingTags)
    .replace(TRAILING_SEPARATOR_PATTERN, '')
    .trim() || original;
  const characters = [...cleaned];

  if (characters.length <= maxLength) return cleaned;
  return `${characters.slice(0, maxLength).join('').trimEnd()}…`;
}
