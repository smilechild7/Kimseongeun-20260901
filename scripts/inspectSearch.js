import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { openDatabase } from '../server/db/connection.js';
import { createProductRepository } from '../server/products/productRepository.js';
import { searchProducts } from '../server/products/searchProducts.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const INSPECTION_CASES = Object.freeze({
  'office-black': {
    query: '10만원 이하 출근용 검정 바지. 너무 붙는 건 싫어요.',
    required: {
      category: 'pants',
      minPrice: null,
      maxPrice: 100000,
      colors: ['black'],
      sizes: [],
    },
    preferred: {
      colors: ['black'],
      sizes: [],
      styleTags: ['minimal'],
      occasionTags: ['office'],
      fitTags: ['relaxed'],
      seasonTags: [],
      keywords: ['편안'],
      avoidKeywords: ['슬림', '타이트'],
      reviewSignals: {
        appearanceMatch: null,
        sizeFit: null,
        materialQuality: null,
      },
    },
  },
  'size-28': {
    query: '28 사이즈가 있고 허벅지가 너무 붙지 않는 바지',
    required: { category: 'pants', sizes: ['28'] },
    preferred: { sizes: ['28'], fitTags: ['relaxed', 'wide'] },
  },
  'appearance-similar': {
    query: '사진과 실물이 비슷하다는 후기가 있는 바지',
    required: { category: 'pants' },
    preferred: { reviewSignals: { appearanceMatch: 'similar' } },
  },
  'no-result': {
    query: '1천원 이하 바지',
    required: { category: 'pants', maxPrice: 1000 },
  },
});

function selectedCase(argumentsList) {
  const argument = argumentsList.find((value) => value.startsWith('--case='));
  const caseId = argument?.slice('--case='.length) || 'office-black';
  if (!INSPECTION_CASES[caseId]) {
    throw new Error(
      `Unknown case: ${caseId}. Use one of ${Object.keys(INSPECTION_CASES).join(', ')}`,
    );
  }
  return { caseId, input: INSPECTION_CASES[caseId] };
}

function main() {
  const { caseId, input } = selectedCase(process.argv.slice(2));
  const full = process.argv.includes('--full');
  const database = openDatabase(path.join(repositoryRoot, 'data/products.db'), {
    readonly: true,
    fileMustExist: true,
  });

  try {
    const result = searchProducts(input, {
      repository: createProductRepository(database),
    });
    const candidates = full
      ? result.candidates
      : result.candidates.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          colors: product.colors,
          sizes: product.sizes,
          styleTags: product.styleTags,
          occasionTags: product.occasionTags,
          fitTags: product.fitTags,
          reviewSignals: product.reviewSummary
            ? {
                appearanceMatch: product.reviewSummary.appearanceMatch.signal,
                sizeFit: product.reviewSummary.sizeFit.signal,
                materialQuality: product.reviewSummary.materialQuality.signal,
              }
            : null,
        }));
    console.log(
      JSON.stringify(
        { caseId, input, hardFilterMatchCount: result.hardFilterMatchCount, candidates },
        null,
        2,
      ),
    );
  } finally {
    database.close();
  }
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ event: 'search.inspect.failed', message: error.message }));
  process.exitCode = 1;
}
