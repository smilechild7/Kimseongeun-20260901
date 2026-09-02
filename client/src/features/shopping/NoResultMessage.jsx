export default function NoResultMessage({ message, suggestion }) {
  return (
    <section className="flex items-start gap-3" aria-label="AI 답변">
      <span className="mt-6 grid size-8 shrink-0 place-items-center rounded-full bg-orange-600 text-[0.65rem] font-bold text-white" aria-hidden="true">AI</span>
      <div className="min-w-0 flex-1 sm:max-w-2xl">
        <p className="mb-2 text-xs font-semibold text-stone-500">Shopping Agent</p>
        <div className="rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          <p className="text-xs font-semibold text-stone-500">검색 결과 없음</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-stone-950">{message}</p>
          <div className="mt-4 border-l-2 border-orange-300 pl-3 text-sm leading-6 text-stone-700">
            <span className="font-semibold text-orange-800">다음 검색 제안</span>
            <p className="mt-1">{suggestion}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
