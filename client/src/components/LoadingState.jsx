import { useEffect, useState } from 'react';

const STAGES = [
  '조건을 확인하고 있어요',
  '상품을 찾고 있어요',
  '실제 구매후기를 함께 확인하고 있어요',
];

export default function LoadingState() {
  const [stage, setStage] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, 3_000);
    const elapsedInterval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1_000);
    return () => {
      window.clearInterval(interval);
      window.clearInterval(elapsedInterval);
    };
  }, []);

  return (
    <section className="flex items-start gap-3" aria-live="polite" aria-busy="true">
      <span className="mt-6 grid size-8 shrink-0 place-items-center rounded-full bg-orange-600 text-[0.65rem] font-bold text-white" aria-hidden="true">AI</span>
      <div className="min-w-0 flex-1 sm:max-w-2xl">
        <p className="mb-2 text-xs font-semibold text-stone-500">Shopping Agent</p>
        <div className="rounded-2xl rounded-tl-sm border border-orange-200 bg-orange-50 px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-stone-900 sm:text-base">{STAGES[stage]}</p>
              <p className="mt-1 text-xs text-stone-600 sm:text-sm">{elapsedSeconds}초 경과 · 보통 20~60초 정도 걸려요.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2" aria-hidden="true">
            {STAGES.map((item, index) => (
              <span
                className={`h-1 flex-1 rounded-full transition-colors ${index <= stage ? 'bg-orange-600' : 'bg-orange-200'}`}
                key={item}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
