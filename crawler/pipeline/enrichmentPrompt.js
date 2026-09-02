import { CONTROLLED_VOCABULARY } from './enrichmentContract.js';

export const ENRICHMENT_INSTRUCTIONS = `당신은 여성 의류 상품과 실제 구매 리뷰를 근거 기반으로 정리하는 분석가다.

규칙:
- 상품 요약은 제공된 상품 정보만 사용해 한국어 1~2문장으로 간결하게 작성한다.
- styleTags, occasionTags, fitTags, seasonTags는 지정된 controlled vocabulary에서만 선택한다.
- 가격, 브랜드, 색상, 판매 사이즈, 치수, 소재, 평점, 총 리뷰 수, 재고, URL 같은 factual data를 새로 만들거나 출력하지 않는다.
- 리뷰 집계는 제공된 리뷰만 근거로 한다. 근거가 부족하면 unknown, 의견이 갈리면 mixed다.
- evidenceTally에는 각 축의 명시적 evidence가 등장한 리뷰 수를 센다. 단순한 칭찬·불만이나 속성 언급을 다른 축의 evidence로 세지 않는다.
- appearanceMatch는 explicit similar와 explicit different가 모두 1개 이상이면 수량 차이와 무관하게 mixed다. similar만 있으면 similar, different만 있으면 different, 둘 다 없으면 unknown이다.
- sizeFit은 runsSmall, trueToSize, runsLarge 중 둘 이상이 1개 이상이면 수량 차이와 무관하게 mixed다. 하나만 있으면 해당 signal, 모두 0이면 unknown이다.
- materialQuality는 positive와 negative가 모두 1개 이상이면 수량 차이와 무관하게 mixed다. 한쪽만 있으면 해당 signal, 모두 0이면 unknown이다. 계절에 맞지 않는 두께나 비신축성 같은 중립 속성은 리뷰가 품질 문제로 평가할 때만 negative로 센다.
- 소수 의견을 다수 의견처럼 표현하지 않는다.
- appearanceMatch는 사진/화면과 실물의 색상·외관이 비슷하거나 다르다는 명시적 비교에만 사용한다. 단순히 색상이 예쁘다는 의견은 비교 근거가 아니다.
- similarReviewerNotes는 같은 리뷰 안에 제공된 structured reviewerProfile이 있을 때만 작성한다. 리뷰 문장에서 키·몸무게·평소 사이즈를 추론하지 않는다.
- analyzedReviewCount는 입력의 savedReviewCount와 정확히 같아야 한다.
- 리뷰가 0개면 세 signal은 모두 unknown이고 positives, concerns, similarReviewerNotes는 빈 배열이다.
- 리뷰가 0개면 evidenceTally의 모든 값도 0이다.
- 확정적인 개인 사이즈 추천이나 착용 보장을 하지 않는다.`;

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  const sanitized = {
    heightCm: profile.heightCm ?? null,
    weightKg: profile.weightKg ?? null,
    usualSize: profile.usualSize ?? null,
    ageGroup: profile.ageGroup ?? null,
  };

  return Object.values(sanitized).some((value) => value !== null && value !== '')
    ? sanitized
    : null;
}

export function productEvidence(product) {
  return {
    productId: `${product.source.shopId}:${product.source.sourceProductId}`,
    name: product.name,
    category: product.category,
    description: product.description,
    material: product.material,
    colors: product.colors ?? [],
    sizes: product.sizes ?? [],
    sizeGuideText: product.sizeGuideText,
    savedReviewCount: product.reviews?.length ?? 0,
    reviews: (product.reviews ?? []).map((review) => ({
      rating: review.rating,
      text: review.text,
      optionText: review.optionText,
      reviewerProfile: sanitizeProfile(review.reviewerProfile),
      createdAt: review.createdAt,
    })),
  };
}

export function enrichmentInput(product) {
  return JSON.stringify(
    {
      task: '상품 속성 요약과 저장된 리뷰의 구매 위험 신호를 하나의 결과로 분석한다.',
      controlledVocabulary: CONTROLLED_VOCABULARY,
      product: productEvidence(product),
    },
    null,
    2,
  );
}
