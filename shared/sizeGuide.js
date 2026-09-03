const CIRCLED_MARKER_PATTERN = /[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/gu;
const MEASUREMENT_HEADER_PATTERN =
  /(허리|힙|엉덩이|허벅지|밑위|밑단|총장|가슴|어깨|소매|암홀|트임|끈|패드|기장|목|팔|둘레|폭|길이)/u;
const MEASUREMENT_VALUE_PATTERN = /(\d|없음|있음)/u;

function cleanText(value) {
  return value?.replace(/\u00a0/gu, ' ').replace(/\s+/gu, ' ').trim() ?? '';
}

function normalizeSize(value) {
  const base = cleanText(value).replace(/\([^)]*\)/gu, '').toUpperCase();

  if (base === 'FREE' || base === 'F' || base === '프리') {
    return 'FREE';
  }

  return /^(?:XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[2-8]XL|[1-5]|\d{2,3})$/u.test(
    base,
  )
    ? base
    : null;
}

function tokenize(text) {
  return [...text.matchAll(/\S+/gu)].map((match) => ({
    index: match.index,
    value: match[0],
  }));
}

function parseHeaders(text, firstRowIndex) {
  const headerText = text.slice(0, firstRowIndex).trim();
  const markers = [...headerText.matchAll(CIRCLED_MARKER_PATTERN)];

  if (markers.length > 0) {
    const prefix = headerText.slice(0, markers[0].index).trim();
    if (!/^[^\s]*사이즈\s*\(cm\)$/iu.test(prefix)) {
      return null;
    }

    const headers = markers.flatMap((marker, index) => {
      const start = marker.index + marker[0].length;
      const end = markers[index + 1]?.index ?? headerText.length;
      const segment = headerText.slice(start, end).trim();

      return index === markers.length - 1 ? segment.split(/\s+/u) : [segment];
    });

    return headers;
  }

  const plainHeader = headerText
    .replace(/^[^\s]*사이즈(?=\s|$)/iu, '')
    .replace(/^\s*\(cm\)\s*/iu, '')
    .trim();

  return plainHeader ? plainHeader.split(/\s+/u) : null;
}

function normalizeRowValues(values, columnCount) {
  if (
    values.length === columnCount + 1 &&
    /^\(앞\)/u.test(values.at(-2)) &&
    /^\(뒤\)/u.test(values.at(-1))
  ) {
    return [...values.slice(0, -2), `${values.at(-2)} / ${values.at(-1)}`];
  }

  return values;
}

export function parseSizeGuideText(value, expectedSizes = []) {
  const text = cleanText(value);
  const normalizedExpectedSizes = new Set(
    expectedSizes.map(normalizeSize).filter(Boolean),
  );

  if (!text || normalizedExpectedSizes.size === 0 || !/사이즈/iu.test(text)) {
    return null;
  }

  const tokens = tokenize(text);
  const rowStartTokens = tokens.filter(({ value: token }) =>
    normalizedExpectedSizes.has(normalizeSize(token)),
  );
  const firstRowToken = rowStartTokens[0];

  if (!firstRowToken) {
    return null;
  }

  const columns = parseHeaders(text, firstRowToken.index);

  if (
    !columns ||
    columns.length < 2 ||
    columns.length > 12 ||
    columns.some(
      (column) =>
        !column ||
        column.length > 30 ||
        !MEASUREMENT_HEADER_PATTERN.test(column),
    )
  ) {
    return null;
  }

  const dataTokens = tokens.slice(tokens.indexOf(firstRowToken));
  const rowStartIndexes = dataTokens
    .map(({ value: token }, index) =>
      normalizedExpectedSizes.has(normalizeSize(token)) ? index : -1,
    )
    .filter((index) => index >= 0);
  const rows = rowStartIndexes.map((start, index) => {
    const end = rowStartIndexes[index + 1] ?? dataTokens.length;
    const size = dataTokens[start].value;
    const rawValues = dataTokens.slice(start + 1, end).map(({ value: token }) => token);
    const values = normalizeRowValues(rawValues, columns.length);

    return { size, values };
  });

  if (
    rows.length === 0 ||
    new Set(rows.map(({ size }) => normalizeSize(size))).size !== rows.length ||
    rows.some(
      ({ values }) =>
        values.length !== columns.length ||
        values.some(
          (measurement) =>
            measurement.length > 50 ||
            !MEASUREMENT_VALUE_PATTERN.test(measurement),
        ),
    )
  ) {
    return null;
  }

  return {
    columns,
    rows,
    unit: /\(cm\)/iu.test(text) ? 'cm' : null,
  };
}

export function isValidSizeGuideText(value, expectedSizes = []) {
  return parseSizeGuideText(value, expectedSizes) !== null;
}
