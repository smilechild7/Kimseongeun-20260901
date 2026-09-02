import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { buildDatabase } from '../../scripts/buildDatabase.js';
import { openDatabase } from '../db/connection.js';
import { createProductRepository } from '../products/productRepository.js';
import { searchProducts } from '../products/searchProducts.js';
import { createShoppingAgent } from './shoppingAgent.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const silentLogger = { log() {} };

test('runs natural language through a mocked tool call, real SQLite search, and factual merge', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'levit-agent-'));
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
      let call = 0;
      const client = {
        responses: {
          async create(request) {
            call += 1;
            if (call === 1) {
              return {
                id: 'resp_search',
                status: 'completed',
                output: [
                  {
                    type: 'function_call',
                    name: 'search_products',
                    call_id: 'call_search',
                    arguments: JSON.stringify({
                      query: '10만원 이하 출근용 검정 바지',
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
                        styleTags: [],
                        occasionTags: ['office'],
                        fitTags: [],
                        seasonTags: [],
                        keywords: [],
                        avoidKeywords: [],
                        reviewSignals: {
                          appearanceMatch: null,
                          sizeFit: null,
                          materialQuality: null,
                        },
                      },
                    }),
                  },
                ],
              };
            }

            const toolResult = JSON.parse(request.input[0].output);
            const product = toolResult.candidates[0];
            return {
              id: 'resp_final',
              status: 'completed',
              output: [],
              output_text: JSON.stringify({
                type: 'recommendation',
                message: '실제 상품 중 조건에 맞는 후보를 골랐어요.',
                suggestion: null,
                recommendations: [
                  {
                    productId: product.id,
                    reason: '바지 카테고리이며 요청 가격 범위 안입니다.',
                    evidence: [
                      { type: 'category', value: 'pants' },
                      { type: 'price', value: 'within_required_range' },
                    ],
                    strengths: ['요청한 가격 조건 안에 있습니다.'],
                    concerns: ['구매 전 실제 판매 사이즈를 확인해야 합니다.'],
                  },
                ],
                comparison: [],
              }),
            };
          },
        },
      };
      const agent = createShoppingAgent({
        client,
        repository,
        search: (input) => searchProducts(input, { repository, logger: silentLogger }),
        logger: silentLogger,
      });

      const result = await agent.chat({
        message: '10만원 이하 출근용 검정 바지 찾아줘',
      });

      assert.equal(call, 2);
      assert.equal(result.type, 'recommendation');
      assert.equal(result.products.length, 1);
      assert.equal(result.products[0].category, 'pants');
      assert.equal(result.products[0].price <= 100000, true);
      assert.match(result.products[0].imageUrl, /^https:\/\//u);
      assert.match(result.products[0].productUrl, /^https:\/\//u);
      assert.equal('description' in result.products[0], false);
    } finally {
      database.close();
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
