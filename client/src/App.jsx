import { useState } from 'react';

const EXAMPLE_QUERIES = [
  '출근용 여름 바지',
  '모임에 입을 단정한 옷',
  '편하게 입을 상의'
];

export default function App() {
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setNotice('상품 데이터와 AI 검색 기능을 연결하고 있어요.');
  }

  function selectExample(example) {
    setQuery(example);
    setNotice('');
  }

  return (
    <main className="min-h-screen overflow-hidden bg-stone-50 text-stone-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(168,162,158,0.24),_transparent_38%)]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <a className="flex items-center gap-3" href="/" aria-label="AI Shopping Agent 홈">
          <span className="grid size-10 place-items-center rounded-full bg-stone-950 text-sm font-bold text-white">
            AI
          </span>
          <span className="font-semibold tracking-tight">Shopping Decision Agent</span>
        </a>
        <span className="rounded-full border border-stone-300 bg-white/70 px-3 py-1.5 text-xs font-medium text-stone-600 backdrop-blur">
          MVP 구축 중
        </span>
      </header>

      <section className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-24">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
            Search less. Decide better.
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.12] tracking-[-0.045em] sm:text-6xl">
            어떤 옷을 찾고 계세요?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            여러 쇼핑몰의 실제 상품과 구매후기를 함께 살펴보고, 조건에 맞는 이유와 구매 전에 확인할 점까지 정리해드려요.
          </p>

          <form className="mt-9" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-3 shadow-[0_24px_70px_rgba(41,37,36,0.10)] sm:flex-row">
              <label className="sr-only" htmlFor="shopping-query">
                원하는 의류 조건
              </label>
              <input
                id="shopping-query"
                className="min-h-14 flex-1 rounded-2xl px-4 text-base outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-orange-300"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setNotice('');
                }}
                placeholder="예: 10만원 이하 출근용 검정 여름 바지"
              />
              <button
                className="min-h-14 rounded-2xl bg-stone-950 px-7 font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                type="submit"
              >
                찾아보기
              </button>
            </div>
            <p className="mt-3 min-h-6 px-2 text-sm text-stone-500" aria-live="polite">
              {notice}
            </p>
          </form>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="검색 예시">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                className="rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-sm text-stone-700 transition hover:border-orange-400 hover:text-orange-800"
                key={example}
                onClick={() => selectExample(example)}
                type="button"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-stone-200 bg-stone-950 p-7 text-white shadow-2xl sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">How it helps</p>
          <ol className="mt-7 space-y-7">
            {[
              ['01', '조건에 맞는 상품 탐색', '여러 쇼핑몰에서 실제 후보를 찾아 최대 15개로 압축해요.'],
              ['02', '실구매 후기 확인', '사진·실물, 사이즈·핏, 소재·품질 의견을 함께 살펴봐요.'],
              ['03', '구매 판단 정리', '최종 상품별 추천 근거와 확인해야 할 위험을 알려드려요.']
            ].map(([number, title, description]) => (
              <li className="grid grid-cols-[2.5rem_1fr] gap-4" key={number}>
                <span className="pt-1 font-mono text-sm text-orange-300">{number}</span>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-stone-400">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}
