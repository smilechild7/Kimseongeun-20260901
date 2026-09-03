import { useState } from 'react';

import {
  buildChatMessage,
  CATEGORY_OPTIONS,
  PRICE_OPTIONS,
  selectionSummary,
} from './query.js';

export default function SearchInput({ compact = false, disabled, onSubmit }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState(null);
  const [size, setSize] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const hasQuery = query.trim().length > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    const submittedQuery = query;
    const requestMessage = buildChatMessage({
      query: submittedQuery,
      category: compact ? '' : category,
      maxPrice: compact ? null : maxPrice,
      size: compact ? '' : size,
    });
    if (!hasQuery || !requestMessage) {
      setValidationMessage('먼저 원하는 옷의 조건을 입력해주세요.');
      return;
    }

    const selections = compact
      ? []
      : selectionSummary({ category, maxPrice, size });
    const displayMessage = [submittedQuery.trim() || '선택 조건으로 검색', ...selections].join(' · ');
    setValidationMessage('');
    if (compact) setQuery('');
    const succeeded = await onSubmit({ requestMessage, displayMessage });
    if (!succeeded && compact) setQuery(submittedQuery);
  }

  return (
    <form
      className={compact ? 'w-full' : 'mt-9'}
      onSubmit={handleSubmit}
    >
      <div
        className={`flex flex-col gap-3 border border-stone-200 bg-white p-3 sm:flex-row sm:flex-wrap ${
          compact
            ? 'rounded-2xl p-2 shadow-sm'
            : 'rounded-3xl shadow-[0_24px_70px_rgba(41,37,36,0.10)]'
        }`}
      >
        <label className="sr-only" htmlFor={compact ? 'refine-query' : 'shopping-query'}>
          원하는 의류 조건
        </label>
        <input
          autoComplete="off"
          className={`order-1 min-w-0 flex-1 bg-transparent outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-orange-300 ${compact ? 'min-h-10 rounded-xl px-3 text-sm' : 'min-h-14 rounded-2xl px-4 text-base'}`}
          disabled={disabled}
          id={compact ? 'refine-query' : 'shopping-query'}
          maxLength={700}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (!nextQuery.trim()) {
              setCategory('');
              setMaxPrice(null);
              setSize('');
            }
            setValidationMessage('');
          }}
          placeholder={compact ? '예: 1번처럼 조금 더 저렴한 걸로' : '예: 12만원 이하 결혼식 하객 원피스'}
          value={query}
        />

        {hasQuery && !compact && (
          <div className="filter-reveal order-2 grid grid-cols-2 gap-3 border-t border-stone-200 pt-3 sm:order-3 sm:basis-full sm:grid-cols-3">
            <label className="col-span-2 min-w-0 text-left sm:col-span-1">
              <span className="mb-1.5 block text-xs font-medium text-stone-500">카테고리</span>
              <select
                className={`min-h-11 w-full min-w-0 rounded-xl border px-3 text-sm font-medium outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${category ? 'border-orange-200 bg-orange-50 text-orange-900' : 'border-stone-300 bg-white text-stone-700'}`}
                disabled={disabled}
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option value="">AI가 문장에서 판단</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="min-w-0 text-left">
              <span className="mb-1.5 block text-xs font-medium text-stone-500">가격</span>
              <select
                className={`${compact ? 'min-h-9' : 'min-h-11'} w-full min-w-0 rounded-xl border px-3 text-sm font-medium outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${maxPrice ? 'border-orange-200 bg-orange-50 text-orange-900' : 'border-stone-300 bg-white text-stone-700'}`}
                disabled={disabled}
                onChange={(event) => setMaxPrice(event.target.value ? Number(event.target.value) : null)}
                value={maxPrice ?? ''}
              >
                <option value="">제한 없음</option>
                {PRICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="min-w-0 text-left" htmlFor={compact ? 'refine-size' : 'shopping-size'}>
              <span className="mb-1.5 block text-xs font-medium text-stone-500">사이즈</span>
              <input
                className={`${compact ? 'min-h-9' : 'min-h-11'} w-full min-w-0 rounded-xl border px-3 text-sm outline-none placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${size.trim() ? 'border-orange-200 bg-orange-50 text-orange-900' : 'border-stone-300 bg-white text-stone-700'}`}
                disabled={disabled}
                id={compact ? 'refine-size' : 'shopping-size'}
                maxLength={30}
                onChange={(event) => setSize(event.target.value)}
                placeholder="M 또는 28"
                value={size}
              />
            </label>
          </div>
        )}

        <button
          className={`order-3 w-full border border-orange-200 bg-orange-100 font-semibold text-orange-900 transition hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400 sm:order-2 sm:w-auto ${compact ? 'min-h-10 rounded-xl px-5 text-sm' : 'min-h-14 rounded-2xl px-7'}`}
          disabled={disabled || !hasQuery}
          type="submit"
        >
          {disabled ? '찾는 중…' : compact ? '다시 찾기' : '찾아보기'}
        </button>
      </div>

      <p className="mt-3 min-h-5 px-2 text-sm text-rose-700" aria-live="polite">
        {validationMessage}
      </p>

      {!hasQuery && !compact && (
        <p className="mt-3 px-2 text-sm text-stone-500">문장을 입력하면 카테고리·가격·사이즈 조건을 더할 수 있어요.</p>
      )}
    </form>
  );
}
