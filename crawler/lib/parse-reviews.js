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
    /(\d{4})[.-](\d{2})[.-](\d{2})\s+(\d{2}):(\d{2}):(\d{2})/u,
  );

  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}+09:00` : null;
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

export function parseGraychicReviews(html, { limit = 20 } = {}) {
  const $ = cheerio.load(html);
  const reviews = [];

  $('#prdReview tr.xans-record-').each((_, row) => {
    if (reviews.length >= limit) {
      return false;
    }

    const link = $(row).find('a.xans-board--list-link').first().clone();
    link.find('.displaynone, img, .sp--font').remove();
    const text = cleanReviewText(link.text());

    if (!text) {
      return;
    }

    const ratingText = $(row)
      .find('.xans-board--colgroup-point img[alt]')
      .first()
      .attr('alt');
    const parsedRating = Number.parseFloat(ratingText?.match(/[\d.]+/u)?.[0]);

    reviews.push({
      rating: Number.isFinite(parsedRating) ? parsedRating : null,
      text,
      optionText: null,
      reviewerProfile: emptyReviewerProfile(),
      imageUrls: [],
      createdAt: normalizeKoreanDate(
        $(row).find('.xans-board--colgroup-date').text(),
      ),
    });
  });

  return reviews;
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
