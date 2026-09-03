import * as cheerio from 'cheerio';

const EMPTY_REVIEWER_PROFILE = Object.freeze({
  heightCm: null,
  weightKg: null,
  usualSize: null,
  ageGroup: null,
});

function cleanText(value) {
  const cleaned = value?.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

function cleanReviewText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();

  return cleaned || null;
}

function emptyReviewerProfile() {
  return { ...EMPTY_REVIEWER_PROFILE };
}

function normalizeKoreanDate(value) {
  const match = value?.match(
    /(\d{4})[.-](\d{2})[.-](\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/u,
  );

  return match
    ? `${match[1]}-${match[2]}-${match[3]}T${match[4] ?? '00'}:${match[5] ?? '00'}:${match[6] ?? '00'}+09:00`
    : null;
}

function numericProperty(properties, namePattern, { min, max }) {
  const property = properties.find((item) => namePattern.test(item?.name ?? ''));
  const match = property?.value?.toString().match(/\d+(?:\.\d+)?/u);
  const value = match ? Number.parseFloat(match[0]) : null;

  return Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function textProperty(properties, namePatterns) {
  for (const pattern of namePatterns) {
    const value = cleanText(
      properties.find((item) => pattern.test(item?.name ?? ''))?.value?.toString(),
    );

    if (value) {
      return value;
    }
  }

  return null;
}

function cremaReviewerProfile(properties) {
  const safeProperties = Array.isArray(properties) ? properties : [];

  return {
    heightCm: numericProperty(safeProperties, /(키|신장|height)/i, {
      min: 100,
      max: 250,
    }),
    weightKg: numericProperty(safeProperties, /(몸무게|체중|weight)/i, {
      min: 20,
      max: 300,
    }),
    usualSize: textProperty(safeProperties, [
      /(평소.*(하의|바지)|(하의|바지).*평소)/i,
      /^(평소.*사이즈|usual.*size)$/i,
      /(평소.*상의|상의.*평소)/i,
    ]),
    ageGroup: textProperty(safeProperties, [/(연령|나이|age)/i]),
  };
}

function cremaOptionText(options) {
  if (!Array.isArray(options)) {
    return null;
  }

  const parts = options
    .map((option) => {
      const name = cleanText(option?.name?.toString());
      const value = cleanText(option?.value?.toString());

      if (!value) {
        return null;
      }

      return name ? `${name}: ${value}` : value;
    })
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' / ') : null;
}

function cremaImageUrls(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return [
    ...new Set(
      images
        .map((image) => image?.url)
        .filter((url) => typeof url === 'string' && /^https:\/\//u.test(url)),
    ),
  ];
}

function firstParsedDate($, row, selectors) {
  for (const selector of selectors) {
    for (const element of $(row).find(selector).toArray()) {
      const parsed = normalizeKoreanDate($(element).text());
      if (parsed) {
        return parsed;
      }
    }
  }

  return null;
}

function firstParsedRating($, row, selectors) {
  for (const selector of selectors) {
    for (const element of $(row).find(selector).toArray()) {
      const ratingText = $(element).attr('alt') ?? $(element).text();
      const parsed = Number.parseFloat(ratingText?.match(/[\d.]+/u)?.[0]);
      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
        return parsed;
      }
    }
  }

  return null;
}

export function parseCafe24Reviews(
  html,
  {
    limit = 20,
    rowSelectors = [
      '#prdReview tr.xans-record-',
      '#prdReview li.xans-record-',
    ],
    textSelectors = [
      'a.xans-board--list-link',
      'td.subject a[href*="/article/"]',
      'strong.os',
    ],
    ratingSelectors = [
      '.xans-board--colgroup-point img[alt]',
      'img[alt$="점"]',
    ],
    dateSelectors = ['.xans-board--colgroup-date', 'td.txtInfo'],
  } = {},
) {
  const $ = cheerio.load(html);
  const reviews = [];

  $(rowSelectors.join(',')).each((_, row) => {
    if (reviews.length >= limit) {
      return false;
    }

    let text = null;
    for (const selector of textSelectors) {
      const textNode = $(row).find(selector).first().clone();
      textNode.find('.displaynone, img, .sp--font').remove();
      text = cleanReviewText(textNode.text());
      if (text) {
        break;
      }
    }

    if (!text) {
      return;
    }

    reviews.push({
      rating: firstParsedRating($, row, ratingSelectors),
      text,
      optionText: null,
      reviewerProfile: emptyReviewerProfile(),
      imageUrls: [],
      createdAt: firstParsedDate($, row, dateSelectors),
    });
  });

  return reviews;
}

export function parseGraychicReviews(html, options) {
  return parseCafe24Reviews(html, options);
}

export function parseCremaReviews(payload, { limit = 20 } = {}) {
  const sourceReviews = Array.isArray(payload?.reviews) ? payload.reviews : [];
  const reviews = [];

  for (const sourceReview of sourceReviews) {
    if (reviews.length >= limit) {
      break;
    }

    const text = cleanReviewText(
      sourceReview?.filtered_message ?? sourceReview?.message,
    );

    if (!text) {
      continue;
    }

    const parsedRating = Number.parseFloat(sourceReview?.score);

    reviews.push({
      rating: Number.isFinite(parsedRating) ? parsedRating : null,
      text,
      optionText: cremaOptionText(sourceReview?.product_options),
      reviewerProfile: cremaReviewerProfile(sourceReview?.customer_properties),
      imageUrls: cremaImageUrls(sourceReview?.images),
      createdAt:
        typeof sourceReview?.created_at === 'string'
          ? sourceReview.created_at
          : null,
    });
  }

  return reviews;
}
