export const SHOPS = {
  graychic: {
    id: 'graychic',
    name: '그레이시크',
    baseUrl: 'https://graychic.co.kr',
    categories: [
      {
        id: 'pants',
        name: '바지',
        url: 'https://graychic.co.kr/product/list.html?cate_no=12',
      },
    ],
    discovery: {
      productLinkSelectors: ['a[id^="anchorBoxName_"]'],
      includeProductPattern: /(팬츠|슬랙스|청바지|데님|jean|pants)/i,
    },
    reviews: {
      type: 'cafe24-html',
    },
  },
  ifemme: {
    id: 'ifemme',
    name: '아이팜므',
    baseUrl: 'https://ifemme.co.kr',
    categories: [
      {
        id: 'pants',
        name: '바지',
        url: 'https://ifemme.co.kr/product/list.html?cate_no=93',
      },
    ],
    discovery: {
      productLinkSelectors: ['a[name^="anchorBoxName_"]'],
    },
    reviews: {
      type: 'crema-api',
      apiBaseUrl: 'https://review9.cre.ma',
      brandCode: 'ifemme.co.kr',
      widgetId: 2,
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
    (category) => category.id === categoryId,
  );

  if (!categoryConfig) {
    throw new Error(`Unknown category for ${shopConfig.id}: ${categoryId}`);
  }

  return categoryConfig;
}
