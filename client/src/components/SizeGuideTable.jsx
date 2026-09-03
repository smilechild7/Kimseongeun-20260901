import { parseSizeGuideText } from '../../../shared/sizeGuide.js';

export default function SizeGuideTable({ sizes, value }) {
  const guide = parseSizeGuideText(value, sizes);

  if (!guide) {
    return null;
  }

  const unitLabel = guide.unit ? ` (${guide.unit})` : '';

  return (
    <details className="mt-3 rounded-xl bg-stone-50 p-3 text-stone-700">
      <summary className="cursor-pointer rounded-lg text-sm font-semibold text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
        실측 사이즈표{unitLabel} 보기
      </summary>
      <div
        aria-label={`실측 사이즈표${unitLabel}`}
        className="mt-3 overflow-x-auto rounded-lg border border-stone-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        role="region"
        tabIndex="0"
      >
        <table className="min-w-max border-separate border-spacing-0 text-center text-xs text-stone-700">
          <caption className="sr-only">상품 실측 사이즈표{unitLabel}</caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-stone-200 bg-stone-100 px-3 py-2 font-semibold text-stone-900" scope="col">
                사이즈
              </th>
              {guide.columns.map((column) => (
                <th className="whitespace-nowrap border-b border-stone-200 bg-stone-100 px-3 py-2 font-semibold text-stone-900" key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row) => (
              <tr key={row.size}>
                <th className="sticky left-0 z-10 whitespace-nowrap border-r border-stone-200 bg-white px-3 py-2 font-semibold text-stone-900 [&:not(:last-child)]:border-b" scope="row">
                  {row.size}
                </th>
                {row.values.map((measurement, index) => (
                  <td className="whitespace-nowrap px-3 py-2 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-stone-100" key={`${row.size}-${guide.columns[index]}`}>
                    {measurement}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
