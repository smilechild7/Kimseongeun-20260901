import * as cheerio from 'cheerio';

import { extractSourceProductId, normalizeProductUrl } from './product-url.js';

function productLabel($, element, href) {
  const text = $(element).text();
  const imageAlt = $(element).find('img[alt]').first().attr('alt') ?? '';
  return `${text} ${imageAlt} ${href}`;
}

export function discoverProductUrls(html, shopConfig, limit = 10) {
  const $ = cheerio.load(html);
  const selectors = shopConfig.discovery?.productLinkSelectors ?? [
    'a[id^="anchorBoxName_"]',
    'a[name^="anchorBoxName_"]',
  ];
  const includePattern = shopConfig.discovery?.includeProductPattern;
  const discovered = [];
  const seenProductIds = new Set();

  $(selectors.join(',')).each((_, element) => {
    if (discovered.length >= limit) {
      return false;
    }

    const href = $(element).attr('href');
    if (!href || (includePattern && !includePattern.test(productLabel($, element, href)))) {
      return;
    }

    const productUrl = normalizeProductUrl(href, shopConfig.baseUrl);
    const productId = extractSourceProductId(productUrl);

    if (!productId || seenProductIds.has(productId)) {
      return;
    }

    seenProductIds.add(productId);
    discovered.push(productUrl);
  });

  return discovered;
}
