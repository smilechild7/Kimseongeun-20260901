export const ENRICHMENT_OVERRIDES = Object.freeze({
  'graychic:12325': Object.freeze({
    appearanceMatch: Object.freeze({
      signal: 'different',
      summary:
        '실물 색감이 예상과 다르다는 리뷰가 확인됐으며, 화면과 실물이 비슷하다는 명시적 비교 리뷰는 확인되지 않았습니다.',
    }),
    sourceReviewPositions: Object.freeze([2, 9, 19]),
    rationale:
      '일반적인 색감·디자인 칭찬은 화면과 실물이 비슷하다는 evidence로 세지 않는다.',
  }),
  'graychic:14387': Object.freeze({
    appearanceMatch: Object.freeze({
      signal: 'mixed',
      summary:
        '화면처럼 옷 라인이 예쁘다는 의견과 사진보다 실물이 더 낫다는 의견이 함께 있어 화면과 실물 비교 evidence가 엇갈립니다.',
    }),
    sourceReviewPositions: Object.freeze([12, 14]),
    rationale:
      '화면과 비슷하다는 비교와 사진보다 실물이 다르다는 비교가 함께 있으므로 strict 기준에서 mixed다.',
  }),
});

export function applyEnrichmentOverrides(productId, enrichment) {
  const override = ENRICHMENT_OVERRIDES[productId];
  if (!override) {
    return enrichment;
  }

  return {
    ...enrichment,
    reviewSummary: {
      ...enrichment.reviewSummary,
      appearanceMatch: { ...override.appearanceMatch },
    },
  };
}
