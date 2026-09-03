const PANTS_PATTERN = /(팬츠|슬랙스|청바지|데님|바지|pants|jean)/i;
const TOP_PATTERN =
  /(티셔츠|니트|셔츠|블라우스|탑|나시|슬리브리스|베스트|조끼|맨투맨|후드|top|tee|shirt|blouse|knit|sleeveless|vest)/i;
const DRESS_PATTERN = /(원피스|dress|ops)/i;
const SKIRT_PATTERN = /(스커트|치마|skirt)/i;
const OUTERWEAR_PATTERN =
  /(아우터|자켓|재킷|코트|점퍼|가디건|블루종|트렌치|패딩|집업|outer|jacket|coat|cardigan|jumper)/i;

const DEFAULT_DISCOVERY_BY_CATEGORY = {
  pants: { includeProductPattern: PANTS_PATTERN },
  top: { includeProductPattern: TOP_PATTERN },
  dress: { includeProductPattern: DRESS_PATTERN },
  skirt: { includeProductPattern: SKIRT_PATTERN },
  outerwear: { includeProductPattern: OUTERWEAR_PATTERN },
};

function category(id, name, baseUrl, categoryNumber, discovery = undefined) {
  return {
    id,
    name,
    url: `${baseUrl}/product/list.html?cate_no=${categoryNumber}`,
    ...(discovery ? { discovery } : {}),
  };
}

function categories(baseUrl, numbers, discoveryByCategory = {}) {
  const discovery = (categoryId) => ({
    ...DEFAULT_DISCOVERY_BY_CATEGORY[categoryId],
    ...discoveryByCategory[categoryId],
  });

  return [
    category('pants', '바지', baseUrl, numbers.pants, discovery('pants')),
    category('top', '상의', baseUrl, numbers.top, discovery('top')),
    category('dress', '원피스', baseUrl, numbers.dress, discovery('dress')),
    category('skirt', '스커트', baseUrl, numbers.skirt, discovery('skirt')),
    category(
      'outerwear',
      '아우터',
      baseUrl,
      numbers.outerwear,
      discovery('outerwear'),
    ),
  ];
}

function cremaReviews(brandCode, widgetId) {
  return {
    type: 'crema-api',
    apiBaseUrl: 'https://review9.cre.ma',
    brandCode,
    widgetId,
  };
}

const graychicBaseUrl = 'https://graychic.co.kr';
const ifemmeBaseUrl = 'https://ifemme.co.kr';
const ririncoBaseUrl = 'https://ririnco.com';
const annanplusBaseUrl = 'https://www.annanplus.co.kr';
const chiclineBaseUrl = 'https://chic-line.com';
const hotpingBaseUrl = 'https://hotping.co.kr';
const commonuniqueBaseUrl = 'https://common-unique.com';
const dodryBaseUrl = 'https://dodry.net';
const maybinsBaseUrl = 'https://maybins.com';
const baddiaryBaseUrl = 'https://baddiary.com';

export const SHOPS = {
  graychic: {
    id: 'graychic',
    name: '그레이시크',
    baseUrl: graychicBaseUrl,
    categories: categories(
      graychicBaseUrl,
      { pants: 12, top: 7, dress: 24, skirt: 12, outerwear: 4 },
      {
        pants: { includeProductPattern: PANTS_PATTERN },
        skirt: { includeProductPattern: SKIRT_PATTERN },
      },
    ),
    discovery: {
      productLinkSelectors: ['a[id^="anchorBoxName_"]'],
    },
    reviews: {
      type: 'cafe24-html',
    },
  },
  ifemme: {
    id: 'ifemme',
    name: '아이팜므',
    baseUrl: ifemmeBaseUrl,
    categories: categories(ifemmeBaseUrl, {
      pants: 93,
      top: 89,
      dress: 94,
      skirt: 92,
      outerwear: 91,
    }),
    discovery: {
      productLinkSelectors: ['a[name^="anchorBoxName_"]'],
    },
    reviews: cremaReviews('ifemme.co.kr', 2),
  },
  ririnco: {
    id: 'ririnco',
    name: '리리앤코',
    baseUrl: ririncoBaseUrl,
    categories: categories(ririncoBaseUrl, {
      pants: 57,
      top: 55,
      dress: 53,
      skirt: 62,
      outerwear: 56,
    }),
    reviews: cremaReviews('ririnco.com', 68),
  },
  annanplus: {
    id: 'annanplus',
    name: '안나앤플러스',
    baseUrl: annanplusBaseUrl,
    categories: categories(
      annanplusBaseUrl,
      { pants: 43, top: 28, dress: 44, skirt: 44, outerwear: 26 },
      {
        dress: { includeProductPattern: DRESS_PATTERN },
        skirt: { includeProductPattern: SKIRT_PATTERN },
      },
    ),
    reviews: cremaReviews('annanplus.com', 2),
  },
  chicline: {
    id: 'chicline',
    name: '시크라인',
    baseUrl: chiclineBaseUrl,
    categories: categories(chiclineBaseUrl, {
      pants: 78,
      top: 69,
      dress: 26,
      skirt: 77,
      outerwear: 28,
    }),
    reviews: {
      type: 'cafe24-html',
    },
  },
  hotping: {
    id: 'hotping',
    name: '핫핑',
    baseUrl: hotpingBaseUrl,
    categories: categories(hotpingBaseUrl, {
      pants: 279,
      top: 29,
      dress: 26,
      skirt: 535,
      outerwear: 27,
    }),
    options: {
      compositeTitlePatterns: [/^타입$/i],
    },
    reviews: cremaReviews('hotping.co.kr', 162),
  },
  commonunique: {
    id: 'commonunique',
    name: '커먼유니크',
    baseUrl: commonuniqueBaseUrl,
    categories: categories(
      commonuniqueBaseUrl,
      { pants: 28, top: 26, dress: 29, skirt: 29, outerwear: 27 },
      {
        dress: { includeProductPattern: DRESS_PATTERN },
        skirt: { includeProductPattern: SKIRT_PATTERN },
      },
    ),
    reviews: cremaReviews('common-unique.com', 2),
  },
  dodry: {
    id: 'dodry',
    name: '도드리',
    baseUrl: dodryBaseUrl,
    categories: categories(dodryBaseUrl, {
      pants: 70,
      top: 29,
      dress: 34,
      skirt: 168,
      outerwear: 93,
    }),
    discovery: {
      productLinkSelectors: ['a.prdImg', 'a.name'],
    },
    reviews: cremaReviews('dodry.net', 4),
  },
  maybins: {
    id: 'maybins',
    name: '메이빈스',
    baseUrl: maybinsBaseUrl,
    categories: categories(maybinsBaseUrl, {
      pants: 12,
      top: 4,
      dress: 7,
      skirt: 224,
      outerwear: 55,
    }),
    discovery: {
      productLinkSelectors: ['a[name^="anchorBoxName_"]'],
    },
    reviews: cremaReviews('maybins.com', 6),
  },
  baddiary: {
    id: 'baddiary',
    name: '배드다이어리',
    baseUrl: baddiaryBaseUrl,
    categories: categories(baddiaryBaseUrl, {
      pants: 48,
      top: 42,
      dress: 24,
      skirt: 49,
      outerwear: 25,
    }),
    reviews: {
      type: 'cafe24-html',
    },
  },
};

export function getShopConfig(shopId) {
  const shopConfig = SHOPS[shopId];

  if (!shopConfig) {
    throw new Error(`Unknown shop: ${shopId}`);
  }

  return shopConfig;
}

export function getCategoryConfig(shopConfig, categoryId) {
  const categoryConfig = shopConfig.categories.find(
    (categoryConfig) => categoryConfig.id === categoryId,
  );

  if (!categoryConfig) {
    throw new Error(`Unknown category for ${shopConfig.id}: ${categoryId}`);
  }

  return categoryConfig;
}
