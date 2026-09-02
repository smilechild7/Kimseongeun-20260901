import { useState } from 'react';

import ProductCard from '../../components/ProductCard.jsx';

const CRITERIA_LABELS = Object.freeze({
  pants: '바지',
  office: '출근',
  formal: '포멀',
  daily: '데일리',
  relaxed: '여유 있는 핏',
  regular: '레귤러 핏',
  wide: '와이드 핏',
  slim: '슬림 핏',
  spring: '봄',
  summer: '여름',
  fall: '가을',
  winter: '겨울',
  all_season: '사계절',
});

function criteriaChips(criteria) {
  const required = criteria?.required ?? {};
  const preferred = criteria?.preferred ?? {};
  return [
    required.category ? CRITERIA_LABELS[required.category] ?? required.category : null,
    required.minPrice !== null && required.minPrice !== undefined
      ? `${required.minPrice.toLocaleString('ko-KR')}원 이상`
      : null,
    required.maxPrice !== null && required.maxPrice !== undefined
      ? `${required.maxPrice.toLocaleString('ko-KR')}원 이하`
      : null,
    ...(required.colors ?? []),
    ...(required.sizes ?? []).map((size) => `사이즈 ${size}`),
    ...(preferred.occasionTags ?? []).map((value) => CRITERIA_LABELS[value] ?? value),
    ...(preferred.fitTags ?? []).map((value) => CRITERIA_LABELS[value] ?? value),
    ...(preferred.seasonTags ?? []).map((value) => CRITERIA_LABELS[value] ?? value),
  ].filter(Boolean);
}

function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

function ProductSummaryRow({ controlsId, expanded, onToggle, product, rank }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className="grid w-full cursor-pointer grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 bg-white p-2.5 text-left transition hover:bg-stone-50 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:p-3"
      onClick={onToggle}
    >
      <a
        className="relative block aspect-square overflow-hidden rounded-xl bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
        href={product.productUrl}
        onClick={(event) => event.stopPropagation()}
        rel="noopener noreferrer"
        target="_blank"
        aria-label={`${product.name} 상품 페이지 새 탭에서 열기`}
      >
        {!imageFailed && product.imageUrl ? (
          <img
            alt=""
            className="size-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={product.imageUrl}
          />
        ) : (
          <span className="grid size-full place-items-center px-1 text-center text-[0.6rem] leading-3 text-stone-500">이미지 없음</span>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-full bg-stone-200 px-1.5 py-0.5 text-[0.6rem] font-bold text-stone-800">{rank}</span>
      </a>

      <span className="min-w-0">
        <span className="block text-[0.68rem] font-medium text-stone-500 sm:text-xs">{product.shopName}</span>
        <a
          className="mt-0.5 line-clamp-2 block text-sm font-semibold leading-5 text-stone-950 underline decoration-transparent underline-offset-2 hover:text-orange-700 hover:decoration-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          href={product.productUrl}
          onClick={(event) => event.stopPropagation()}
          rel="noopener noreferrer"
          target="_blank"
        >
          {product.name}
        </a>
        <span className="mt-1 block text-sm font-bold text-orange-800">{formatPrice(product.price)}</span>
      </span>

      <button
        aria-controls={controlsId}
        aria-expanded={expanded}
        className="inline-flex items-center justify-center gap-1 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1.5 text-xs font-medium leading-5 text-stone-950 transition hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        type="button"
      >
        <span>{expanded ? '상세접기' : '상세보기'}</span>
        <span className="grid size-3 place-items-center text-xs leading-none" aria-hidden="true">{expanded ? '↑' : '↓'}</span>
      </button>
    </div>
  );
}

export default function RecommendationResult({ result }) {
  const [expandedProductId, setExpandedProductId] = useState(null);
  const productsById = new Map(result.products.map((product) => [product.id, product]));
  const chips = criteriaChips(result.criteria);

  return (
    <div>
      <section className="flex items-start gap-3" aria-label="AI 답변">
        <span className="mt-6 grid size-8 shrink-0 place-items-center rounded-full bg-orange-600 text-[0.65rem] font-bold text-white" aria-hidden="true">AI</span>
        <div className="min-w-0 flex-1 sm:max-w-4xl">
          <p className="mb-2 text-xs font-semibold text-stone-500">Shopping Agent</p>
          <div className="rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold leading-6 text-stone-900">{result.message}</h2>
            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="해석된 검색 조건">
                {chips.map((chip, index) => (
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600" key={`${chip}-${index}`}>{chip}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {result.comparison.length > 1 && (
        <section className="ml-11 mt-5 max-w-4xl border-l-2 border-orange-400 py-1 pl-4 sm:pl-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">후보 간 핵심 차이</p>
          <ul className="mt-3 space-y-2">
            {result.comparison.map((item, index) => (
              <li className="text-sm leading-6 text-stone-700" key={item.productId}>
                <span className="font-semibold text-stone-950">{index + 1}. {productsById.get(item.productId)?.name ?? item.productId}</span>
                {' — '}{item.bestFor} <span className="text-stone-500">다만, {item.tradeoff}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ml-0 mt-7 max-w-4xl sm:ml-11" aria-label="추천 상품">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">추천 후보</p>
            <h3 className="mt-1 text-sm font-semibold text-stone-900">후보를 비교하고 하나씩 자세히 확인하세요</h3>
          </div>
          <span className="shrink-0 text-xs text-stone-500">{result.products.length}개</span>
        </div>
        <div className="space-y-2.5">
          {result.products.map((product, index) => {
            const expanded = expandedProductId === product.id;
            const detailId = `product-detail-${index + 1}`;
            const toggle = () => setExpandedProductId((current) => current === product.id ? null : product.id);

            return (
              <article
                className={`overflow-hidden rounded-2xl border transition ${expanded ? 'border-orange-400 shadow-sm' : 'border-stone-200'}`}
                key={product.id}
              >
                <ProductSummaryRow
                  controlsId={detailId}
                  expanded={expanded}
                  onToggle={toggle}
                  product={product}
                  rank={index + 1}
                />
                {expanded && (
                  <div className="detail-reveal border-t border-orange-200" id={detailId}>
                    <ProductCard onCollapse={toggle} product={product} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
