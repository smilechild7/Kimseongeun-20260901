import { useState } from 'react';

import {
  buildChatMessage,
  PRICE_OPTIONS,
  selectionSummary,
} from './query.js';

function ChoiceButton({ active, children, disabled, onClick }) {
  return (
    <button
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
        active
          ? 'border-stone-300 bg-stone-200 text-stone-900'
          : 'border-stone-300 bg-white text-stone-700 hover:border-orange-400'
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export default function SearchInput({ compact = false, disabled, onSubmit }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState(null);
  const [size, setSize] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const hasQuery = query.trim().length > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    const requestMessage = buildChatMessage({ query, category, maxPrice, size });
    if (!hasQuery || !requestMessage) {
      setValidationMessage('먼저 원하는 바지 조건을 입력해주세요.');
      return;
    }

    const selections = selectionSummary({ category, maxPrice, size });
    const displayMessage = [query.trim() || '선택 조건으로 검색', ...selections].join(' · ');
    setValidationMessage('');
    const succeeded = await onSubmit({ requestMessage, displayMessage });
    if (succeeded && compact) {
      setQuery('');
      setCategory('');
      setMaxPrice(null);
      setSize('');
    }
  }

  return (
    <form
      className={compact ? 'rounded-3xl border border-stone-200 bg-white p-4 shadow-lg sm:p-5' : 'mt-9'}
      onSubmit={handleSubmit}
    >
      <div
        className={`flex flex-col gap-3 border border-stone-200 bg-white p-3 ${
          compact
            ? 'rounded-2xl bg-stone-50 shadow-inner sm:flex-row'
            : 'rounded-3xl shadow-[0_24px_70px_rgba(41,37,36,0.10)] sm:flex-row'
        }`}
      >
        <label className="sr-only" htmlFor={compact ? 'refine-query' : 'shopping-query'}>
          원하는 의류 조건
        </label>
        <input
          autoComplete="off"
          className="min-h-14 min-w-0 flex-1 rounded-2xl bg-transparent px-4 text-base outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-orange-300"
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
          placeholder={compact ? '예: 1번처럼 조금 더 저렴한 걸로' : '예: 10만원 이하 출근용 검정 바지'}
          value={query}
        />
        <button
          className="min-h-14 rounded-2xl bg-stone-200 px-7 font-semibold text-stone-900 transition hover:bg-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          disabled={disabled || !hasQuery}
          type="submit"
        >
          {disabled ? '찾는 중…' : compact ? '다시 찾기' : '찾아보기'}
        </button>
      </div>

      {hasQuery && (
      <div className="filter-reveal mt-4 grid gap-4 rounded-2xl border border-stone-200/80 bg-white/80 p-4 sm:grid-cols-3">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">카테고리</legend>
          <ChoiceButton
            active={category === 'pants'}
            disabled={disabled}
            onClick={() => setCategory(category === 'pants' ? '' : 'pants')}
          >
            바지
          </ChoiceButton>
          <p className="mt-2 text-xs text-stone-400">현재 바지 상품을 지원해요.</p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">가격 상한</legend>
          <div className="flex flex-wrap gap-2">
            {PRICE_OPTIONS.map((option) => (
              <ChoiceButton
                active={maxPrice === option.value}
                disabled={disabled}
                key={option.value}
                onClick={() => setMaxPrice(maxPrice === option.value ? null : option.value)}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">판매 사이즈</legend>
          <label className="sr-only" htmlFor={compact ? 'refine-size' : 'shopping-size'}>판매 사이즈</label>
          <input
            className="min-h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
            disabled={disabled}
            id={compact ? 'refine-size' : 'shopping-size'}
            maxLength={30}
            onChange={(event) => setSize(event.target.value)}
            placeholder="예: M 또는 28"
            value={size}
          />
        </fieldset>
      </div>
      )}

      <p className="mt-3 min-h-5 px-2 text-sm text-rose-700" aria-live="polite">
        {validationMessage}
      </p>

      {!hasQuery && !compact && (
        <p className="mt-3 px-2 text-sm text-stone-500">문장을 입력하면 카테고리·가격·사이즈 조건을 더할 수 있어요.</p>
      )}
    </form>
  );
}
