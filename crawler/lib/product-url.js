export function normalizeProductUrl(href, baseUrl) {
  const url = new URL(href, baseUrl);

  url.hash = '';
  url.searchParams.delete('display_group');
  url.searchParams.delete('icid');

  return url.toString();
}

export function extractSourceProductId(productUrl) {
  const url = new URL(productUrl);
  const queryProductId = url.searchParams.get('product_no');

  if (queryProductId && /^\d+$/.test(queryProductId)) {
    return queryProductId;
  }

  const prettyUrlMatch = url.pathname.match(/\/product\/[^/]+\/(\d+)(?:\/|$)/);
  return prettyUrlMatch?.[1] ?? null;
}
