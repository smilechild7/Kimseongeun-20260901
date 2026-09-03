import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { buildDatabase } from '../../scripts/buildDatabase.js';
import { openDatabase } from '../db/connection.js';
import { createProductRepository } from './productRepository.js';
import { searchProducts } from './searchProducts.js';
import { colorsMatch, sizesMatch } from './searchNormalization.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const silentLogger = { log() {} };

test('searches the committed catalog with factual compact DTOs', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'levit-search-'));
  const databasePath = path.join(temporaryDirectory, 'products.db');

  try {
    await buildDatabase({
      databasePath,
      rawDataDirectory: path.join(repositoryRoot, 'data/raw'),
      enrichedDataDirectory: path.join(repositoryRoot, 'data/enriched'),
      migrationsDirectory: path.join(repositoryRoot, 'db/migrations'),
    });
    const database = openDatabase(databasePath, {
      readonly: true,
      fileMustExist: true,
    });

    try {
      const repository = createProductRepository(database);
      const officeBlack = searchProducts(
        {
          query: '10만원 이하 출근용 검정 바지. 너무 붙는 건 싫어요.',
          required: {
            category: 'pants',
            maxPrice: 100000,
            colors: ['black'],
          },
          preferred: {
            colors: ['black'],
            occasionTags: ['office'],
            fitTags: ['relaxed'],
            avoidKeywords: ['슬림', '타이트'],
          },
        },
        { repository, logger: silentLogger },
      );

      assert.ok(officeBlack.hardFilterMatchCount > 15);
      assert.equal(officeBlack.candidates.length, 15);
      assert.equal(
        officeBlack.candidates.every((product) =>
          product.colors.some((color) => colorsMatch(color, 'black')),
        ),
        true,
      );
      assert.equal(
        officeBlack.candidates.every((product) => product.price <= 100000),
        true,
      );
      assert.equal('imageUrl' in officeBlack.candidates[0], false);
      assert.equal('description' in officeBlack.candidates[0], false);

      const size28 = searchProducts(
        {
          query: '28 사이즈 편한 바지',
          required: { category: 'pants', sizes: ['28'] },
          preferred: { fitTags: ['relaxed'], sizes: ['28'] },
        },
        { repository, logger: silentLogger },
      );
      assert.ok(size28.hardFilterMatchCount > 0);
      assert.equal(
        size28.candidates.every((product) =>
          product.sizes.some((size) => sizesMatch(size, '28')),
        ),
        true,
      );

      const appearance = searchProducts(
        {
          query: '사진과 실물이 비슷한 바지',
          required: { category: 'pants' },
          preferred: { reviewSignals: { appearanceMatch: 'similar' } },
        },
        { repository, logger: silentLogger },
      );
      assert.equal(
        appearance.candidates.slice(0, 2).every(
          (product) => product.reviewSummary.appearanceMatch.signal === 'similar',
        ),
        true,
      );

      const expectedCategoryCounts = {
        pants: 120,
        top: 100,
        dress: 100,
        skirt: 100,
        outerwear: 100,
      };
      for (const [category, expectedCount] of Object.entries(
        expectedCategoryCounts,
      )) {
        const allCategoryCandidates = repository.findSearchCandidates({
          category,
          minPrice: null,
          maxPrice: null,
        });
        const result = searchProducts(
          {
            query: `${category} category regression`,
            required: { category },
            preferred: {},
          },
          { repository, logger: silentLogger },
        );

        assert.equal(allCategoryCandidates.length, expectedCount);
        assert.equal(
          new Set(
            allCategoryCandidates.map(
              ({ product }) => product.source.shopId,
            ),
          ).size,
          10,
        );
        assert.equal(result.hardFilterMatchCount, expectedCount);
        assert.equal(result.candidates.length, 15);
        assert.equal(
          result.candidates.every((product) => product.category === category),
          true,
        );

        const noResult = searchProducts(
          {
            query: `1천원 이하 ${category}`,
            required: { category, maxPrice: 1000 },
            preferred: {},
          },
          { repository, logger: silentLogger },
        );
        assert.equal(noResult.hardFilterMatchCount, 0);
        assert.deepEqual(noResult.candidates, []);
      }
    } finally {
      database.close();
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
