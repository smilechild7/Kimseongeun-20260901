export default function ClarificationMessage({ message }) {
  return (
    <section className="flex items-start gap-3" aria-label="AI 답변">
      <span className="mt-6 grid size-8 shrink-0 place-items-center rounded-full bg-orange-600 text-[0.65rem] font-bold text-white" aria-hidden="true">AI</span>
      <div className="min-w-0 flex-1 sm:max-w-2xl">
        <p className="mb-2 text-xs font-semibold text-stone-500">Shopping Agent</p>
        <div className="rounded-2xl rounded-tl-sm border border-orange-200 bg-orange-50 px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          <p className="text-xs font-semibold text-orange-700">조건을 조금만 더 알려주세요</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-stone-900">{message}</p>
        </div>
      </div>
    </section>
  );
}
