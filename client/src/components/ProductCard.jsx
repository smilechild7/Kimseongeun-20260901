const SIGNAL_LABELS = Object.freeze({
  similar: '사진과 비슷하다는 의견',
  different: '사진과 다르다는 의견',
  runs_small: '작게 느껴지는 편',
  true_to_size: '정사이즈 의견',
  runs_large: '크게 느껴지는 편',
  positive: '긍정 의견',
  negative: '부정 의견',
  mixed: '의견이 엇갈림',
  unknown: '판단할 정보가 부족해요',
});

const EVIDENCE_LABELS = Object.freeze({
  category: '카테고리',
  price: '가격',
  color: '색상',
  size: '사이즈',
  style: '스타일',
  occasion: '활용',
  fit: '핏',
  season: '계절',
  review_appearance_match: '사진·실물 후기',
  review_size_fit: '사이즈 후기',
  review_material_quality: '소재 후기',
});

const VALUE_LABELS = Object.freeze({
  pants: '바지',
  top: '상의',
  dress: '원피스',
  skirt: '스커트',
  outerwear: '아우터',
  within_required_range: '요청 가격 범위',
  minimal: '미니멀',
  classic: '클래식',
  casual: '캐주얼',
  feminine: '페미닌',
  modern: '모던',
  sporty: '스포티',
  office: '출근',
  formal: '포멀',
  daily: '데일리',
  event: '모임',
  travel: '여행',
  exercise: '운동',
  slim: '슬림',
  regular: '레귤러',
  relaxed: '여유',
  oversized: '오버사이즈',
  wide: '와이드',
  spring: '봄',
  summer: '여름',
  fall: '가을',
  winter: '겨울',
  all_season: '사계절',
  ...SIGNAL_LABELS,
});

function ReviewSignal({ label, value }) {
  const signal = value?.signal ?? 'unknown';
  const isUnknown = signal === 'unknown';
  return (
    <div className={`rounded-2xl border p-4 ${isUnknown ? 'border-stone-200 bg-stone-50' : 'border-orange-100 bg-orange-50/60'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-stone-900">{label}</h4>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isUnknown ? 'bg-stone-200 text-stone-600' : 'bg-white text-orange-800'}`}>
          {SIGNAL_LABELS[signal] ?? signal}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        {value?.summary || '판단할 정보가 부족해요.'}
      </p>
    </div>
  );
}

function BulletList({ items, emptyText, tone = 'positive' }) {
  if (!items?.length) {
    return <p className="text-sm text-stone-500">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li className="grid grid-cols-[1rem_1fr] gap-2 text-sm leading-6 text-stone-700" key={item}>
          <span className={tone === 'warning' ? 'text-amber-600' : 'text-emerald-700'} aria-hidden="true">
            {tone === 'warning' ? '△' : '✓'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ProductCard({ onCollapse, product }) {
  const review = product.reviewSummary ?? {};
  const availableReviewSignals = [
    { label: '사진·실물', value: review.appearanceMatch },
    { label: '사이즈·핏', value: review.sizeFit },
    { label: '소재·품질', value: review.materialQuality },
  ].filter(({ value }) => value?.signal && value.signal !== 'unknown');

  return (
    <div className="flex min-w-0 flex-col bg-white p-4 sm:p-5">
        <section>
          <h3 className="text-sm font-bold text-stone-950">왜 내 조건에 맞나요?</h3>
          <p className="mt-2 text-sm leading-6 text-stone-700">{product.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.evidence?.map((evidence, index) => (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800" key={`${evidence.type}-${evidence.value}-${index}`}>
                {EVIDENCE_LABELS[evidence.type] ?? evidence.type}: {VALUE_LABELS[evidence.value] ?? evidence.value}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6 border-t border-stone-200 pt-5">
          <h3 className="text-sm font-bold text-stone-950">색상·소재</h3>
          <dl className="mt-3 grid gap-3 text-sm">
            <div className="grid grid-cols-[4.5rem_1fr] gap-2"><dt className="text-stone-500">색상</dt><dd className="text-stone-800">{product.colors?.length ? product.colors.join(' · ') : '판단할 정보가 부족해요'}</dd></div>
            <div className="grid grid-cols-[4.5rem_1fr] gap-2"><dt className="text-stone-500">소재</dt><dd className="text-stone-800">{product.material || '판단할 정보가 부족해요'}</dd></div>
          </dl>
        </section>

        <section className="mt-6 border-t border-stone-200 pt-5">
          <h3 className="text-sm font-bold text-stone-950">사이즈·핏 참고</h3>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            <span className="text-stone-500">판매 사이즈</span>{' '}
            {product.sizes?.length ? product.sizes.join(' · ') : '판단할 정보가 부족해요'}
          </p>
          {product.sizeGuideText ? (
            <details className="mt-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
              <summary className="cursor-pointer font-semibold text-stone-800">사이즈표 자세히 보기</summary>
              <p className="mt-3 whitespace-pre-line leading-6">{product.sizeGuideText}</p>
            </details>
          ) : null}
        </section>

        {availableReviewSignals.length > 0 && (
          <section className="mt-6 border-t border-stone-200 pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-stone-950">실제 구매한 사람들은?</h3>
              <span className="text-xs text-stone-500">최근 {review.analyzedReviewCount ?? 0}개 분석 · 전체 후기 {product.reviewCount ?? 0}개</span>
            </div>
            <div className="mt-3 space-y-3">
              {availableReviewSignals.map(({ label, value }) => (
                <ReviewSignal key={label} label={label} value={value} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 border-t border-stone-200 pt-5">
          <h3 className="text-sm font-bold text-stone-950">좋았던 점</h3>
          <div className="mt-3">
            <BulletList items={product.strengths} emptyText="확인된 장점이 아직 없어요." />
          </div>
        </section>

        <section className="mt-6 border-t border-stone-200 pt-5">
          <h3 className="text-sm font-bold text-stone-950">구매 전 확인하세요</h3>
          <div className="mt-3">
            <BulletList items={product.concerns} emptyText="추가로 확인된 우려가 없어요." tone="warning" />
          </div>
        </section>

        <a
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl border border-orange-200 bg-orange-100 px-5 text-sm font-bold text-orange-900 transition hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          href={product.productUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          상품 보러가기 <span className="ml-2" aria-hidden="true">↗</span>
        </a>
        <button
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl border border-stone-300 bg-stone-50 px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          onClick={onCollapse}
          type="button"
        >
          카드 접기 <span className="ml-2" aria-hidden="true">⌃</span>
        </button>
    </div>
  );
}
