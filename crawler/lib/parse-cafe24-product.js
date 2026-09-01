import * as cheerio from 'cheerio';

import { extractSourceProductId } from './product-url.js';

function cleanText(value) {
  const cleaned = value?.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

function parseMoney(value) {
  const firstNumber = value?.match(/[\d,]+/u)?.[0];
  if (!firstNumber) {
    return null;
  }

  const parsed = Number.parseInt(firstNumber.replaceAll(',', ''), 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function normalizeAssetUrl(value, baseUrl) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function findJsonLdProduct($) {
  const candidates = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const parsed = JSON.parse($(element).text());
      candidates.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // Invalid third-party JSON-LD is ignored in favor of meta and DOM fallbacks.
    }
  });

  for (const candidate of candidates) {
    const nested = candidate?.['@graph'];
    const nodes = Array.isArray(nested) ? nested : [candidate];
    const product = nodes.find((node) => {
      const type = node?.['@type'];
      return type === 'Product' || (Array.isArray(type) && type.includes('Product'));
    });

    if (product) {
      return product;
    }
  }

  return null;
}

function jsonLdOffer(product) {
  const offers = Array.isArray(product?.offers) ? product.offers : [product?.offers];
  return offers.find(Boolean) ?? null;
}

function unique(values) {
  return [...new Set(values.map(cleanText).filter(Boolean))];
}

function isPlaceholderOption(value) {
  return (
    !value ||
    value === '*' ||
    value === '**' ||
    /^-+$/.test(value) ||
    /선택|필수|옵션/u.test(value)
  );
}

function extractOptionValues($, kind) {
  const matchesKind =
    kind === 'size' ? /(size|사이즈)/i : /(color|colour|색상|컬러)/i;
  const values = [];

  $('[option_title]').each((_, element) => {
    const title = $(element).attr('option_title') ?? '';
    if (!matchesKind.test(title)) {
      return;
    }

    $(element)
      .find('option')
      .each((__, option) => {
        const value = $(option).attr('value') ?? $(option).text();
        if (!isPlaceholderOption(value)) {
          values.push(value);
        }
      });

    $(element)
      .find('[option_value]')
      .each((__, option) => {
        const value = $(option).attr('option_value') ?? $(option).attr('title');
        if (!isPlaceholderOption(value)) {
          values.push(value);
        }
      });
  });

  return unique(values);
}

function extractSizesFromName(name) {
  const sizes = [];
  const sizeTokenPattern = /^(?:free|xs|s|m|l|xl|xxl|xxxl|프리)(?:\([^)]*\))?$/i;

  for (const match of name.matchAll(/\[([^\]]+)\]/g)) {
    const tokens = match[1].split(',').map((token) => token.trim());

    if (tokens.length > 0 && tokens.every((token) => sizeTokenPattern.test(token))) {
      sizes.push(...tokens);
    }
  }

  return unique(sizes);
}

function basicInfoValue($, labelPattern) {
  let result = null;

  $('tr').each((_, row) => {
    const label = cleanText($(row).find('th').first().text());
    if (!label || !labelPattern.test(label)) {
      return;
    }

    result = cleanText($(row).find('td').first().text());
    return false;
  });

  return result;
}

function extractSizeGuideText($, selectors = []) {
  const candidateSelectors = [
    ...selectors,
    '#prdDetail table',
    '.xans-product-additional table',
    '[id*="detail"] table',
  ];
  const dimensionPattern = /(허리|힙|엉덩이|허벅지|밑위|밑단|총장|가슴|어깨|소매)/gi;
  const reviewTableHeaderPattern = /(번호|제목|작성자|작성일|조회|평점)/;

  for (const selector of candidateSelectors) {
    const elements = $(selector).toArray();

    for (const element of elements) {
      const cells = $(element)
        .find('th,td')
        .toArray()
        .map((cell) => cleanText($(cell).text()))
        .filter(Boolean);
      const text = cleanText(cells.length > 0 ? cells.join(' ') : $(element).text());
      const numberCount = text?.match(/\d+(?:\.\d+)?/g)?.length ?? 0;
      const dimensionCount = new Set(text?.match(dimensionPattern) ?? []).size;
      const firstRowText = cleanText($(element).find('tr').first().text()) ?? '';

      if (
        text &&
        text.length <= 2_000 &&
        !reviewTableHeaderPattern.test(firstRowText) &&
        numberCount >= 2 &&
        ((/cm/i.test(text) && dimensionCount >= 1) || dimensionCount >= 3)
      ) {
        return text;
      }
    }
  }

  return null;
}

function aggregateRating(product) {
  const rating = Number.parseFloat(product?.aggregateRating?.ratingValue);
  const reviewCount = Number.parseInt(product?.aggregateRating?.reviewCount, 10);

  return {
    rating: Number.isFinite(rating) ? rating : null,
    reviewCount: Number.isSafeInteger(reviewCount) ? reviewCount : null,
  };
}

export function parseCafe24Product(
  html,
  { shopConfig, categoryConfig, productUrl, crawledAt = new Date().toISOString() },
) {
  const $ = cheerio.load(html);
  const product = findJsonLdProduct($);
  const offer = jsonLdOffer(product);
  const sourceProductId =
    extractSourceProductId(productUrl) ??
    $('[option_product_no]').first().attr('option_product_no') ??
    null;
  const name = cleanText(
    $('meta[property="og:title"]').attr('content') ?? product?.name,
  );
  const basePrice =
    parseMoney($('#span_product_price_text').first().text()) ??
    parseMoney($('meta[property="product:price:amount"]').attr('content')) ??
    parseMoney(offer?.price?.toString());
  const salePrice = parseMoney($('#span_product_price_sale').first().text());
  const price = salePrice ?? basePrice;
  const imageUrl = normalizeAssetUrl(
    $('meta[property="og:image"]').attr('content') ??
      (Array.isArray(product?.image) ? product.image[0] : product?.image),
    shopConfig.baseUrl,
  );
  const jsonLdRating = aggregateRating(product);
  const domReviewCount = Number.parseInt(
    $('.sp__product_data[scope="index"]').first().attr('data-review'),
    10,
  );

  if (!sourceProductId || !name || price === null || !imageUrl) {
    throw new Error(
      `Missing required product data: id=${sourceProductId ?? 'null'} name=${name ?? 'null'} price=${price ?? 'null'} image=${imageUrl ?? 'null'}`,
    );
  }

  const optionSizes = extractOptionValues($, 'size');

  return {
    source: {
      shopId: shopConfig.id,
      shopName: shopConfig.name,
      sourceProductId,
      productUrl,
    },
    name,
    brand: cleanText(
      typeof product?.brand === 'string' ? product.brand : product?.brand?.name,
    ),
    category: categoryConfig.id,
    price,
    originalPrice: salePrice !== null && basePrice > salePrice ? basePrice : null,
    imageUrl,
    colors: extractOptionValues($, 'color'),
    sizes: optionSizes.length > 0 ? optionSizes : extractSizesFromName(name),
    sizeGuideText: extractSizeGuideText(
      $,
      shopConfig.selectors?.sizeGuideText ?? [],
    ),
    material: basicInfoValue($, /^(소재|material)$/i),
    description: cleanText(
      product?.description ??
        $('meta[property="og:description"]').attr('content') ??
        $('meta[name="description"]').attr('content'),
    ),
    rating: jsonLdRating.rating,
    reviewCount: Number.isSafeInteger(domReviewCount)
      ? domReviewCount
      : jsonLdRating.reviewCount,
    reviews: [],
    crawledAt,
  };
}
