const PRICE_LABELS = Object.freeze({
  50000: '5만원 이하',
  70000: '7만원 이하',
  100000: '10만원 이하',
});

export const PRICE_OPTIONS = Object.freeze(
  Object.entries(PRICE_LABELS).map(([value, label]) => ({
    value: Number(value),
    label,
  })),
);

export function buildChatMessage({ query, category, maxPrice, size }) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;
  const conditions = [];
  if (category === 'pants') conditions.push('카테고리=바지');
  if (maxPrice) conditions.push(`최대 가격=${Number(maxPrice).toLocaleString('ko-KR')}원`);
  if (size.trim()) conditions.push(`판매 사이즈=${size.trim()}`);

  if (conditions.length === 0) return trimmedQuery;
  return `${trimmedQuery}\n\n선택한 필수 조건(자연어와 충돌하면 이 조건 우선): ${conditions.join('; ')}`;
}

export function selectionSummary({ category, maxPrice, size }) {
  return [
    category === 'pants' ? '바지' : null,
    maxPrice ? PRICE_LABELS[maxPrice] : null,
    size.trim() ? `사이즈 ${size.trim()}` : null,
  ].filter(Boolean);
}
