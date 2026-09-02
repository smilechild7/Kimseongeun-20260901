import assert from 'node:assert/strict';
import test from 'node:test';

import { createShoppingAgent, AgentRuntimeError } from './shoppingAgent.js';

const config = {
  model: 'gpt-test',
  reasoningEffort: 'low',
  maxToolRounds: 3,
  maxOutputTokens: 4000,
};
const candidate = {
  id: 'shop:1',
  name: '검정 팬츠',
  brand: null,
  category: 'pants',
  price: 59000,
  colors: ['검정'],
  sizes: ['M'],
  sizeGuideText: null,
  material: null,
  summary: '출근용 팬츠',
  styleTags: ['minimal'],
  occasionTags: ['office'],
  fitTags: ['wide'],
  seasonTags: [],
  extraTags: [],
  reviewSummary: {
    appearanceMatch: { signal: 'unknown', summary: '근거 부족' },
    sizeFit: { signal: 'true_to_size', summary: '정사이즈' },
    materialQuality: { signal: 'unknown', summary: '근거 부족' },
  },
};
const factualProduct = {
  id: 'shop:1',
  source: { shopName: '쇼핑몰', productUrl: 'https://shop.example/1' },
  name: '검정 팬츠',
  brand: null,
  category: 'pants',
  price: 59000,
  imageUrl: 'https://shop.example/1.jpg',
  colors: ['검정'],
  sizes: ['M'],
  sizeGuideText: null,
  material: null,
  rating: null,
  reviewCount: 3,
};
const silentLogger = { log() {} };

function toolResponse(id = 'resp_tool') {
  return {
    id,
    status: 'completed',
    output: [
      {
        type: 'function_call',
        name: 'search_products',
        call_id: 'call_search',
        arguments: JSON.stringify({
          query: '10만원 이하 검정 출근 바지',
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
    usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
  };
}

function finalResponse(output, id = 'resp_final') {
  return {
    id,
    status: 'completed',
    output: [],
    output_text: JSON.stringify(output),
    usage: { input_tokens: 500, output_tokens: 100, total_tokens: 600 },
  };
}

function recommendationOutput(productId = 'shop:1') {
  return {
    type: 'recommendation',
    message: '조건에 맞는 상품을 골랐어요.',
    suggestion: null,
    recommendations: [
      {
        productId,
        reason: '가격과 출근 조건에 맞습니다.',
        evidence: [
          { type: 'price', value: 'within_required_range' },
          { type: 'occasion', value: 'office' },
        ],
        strengths: ['출근용 태그가 있습니다.'],
        concerns: ['소재 후기는 부족합니다.'],
      },
    ],
    comparison: [],
  };
}

function createMockAgent(responses, overrides = {}) {
  const requests = [];
  const client = {
    responses: {
      async create(request) {
        requests.push(request);
        return responses.shift();
      },
    },
  };
  const searchCalls = [];
  const agent = createShoppingAgent({
    client,
    config: overrides.config ?? config,
    search(input) {
      searchCalls.push(input);
      return overrides.searchResult ?? {
        hardFilterMatchCount: 1,
        candidates: [candidate],
      };
    },
    repository: {
      getProductsByIds: () => [factualProduct],
    },
    logger: silentLogger,
  });
  return { agent, requests, searchCalls };
}

test('executes strict search tool then returns factual recommendations', async () => {
  const { agent, requests, searchCalls } = createMockAgent([
    toolResponse(),
    finalResponse(recommendationOutput()),
  ]);

  const result = await agent.chat({ message: '검정 출근 바지 찾아줘' });

  assert.equal(result.type, 'recommendation');
  assert.equal(result.products[0].id, 'shop:1');
  assert.equal(result.products[0].imageUrl, factualProduct.imageUrl);
  assert.equal(searchCalls.length, 1);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].tools[0].strict, true);
  assert.equal(requests[0].text.format.strict, true);
  assert.equal(requests[0].store, true);
  assert.equal(requests[1].previous_response_id, 'resp_tool');
  assert.equal(requests[1].input[0].type, 'function_call_output');
  assert.equal(JSON.parse(requests[1].input[0].output).candidates.length, 1);
});

test('returns one clarification without searching and continues previous response state', async () => {
  const clarification = {
    type: 'clarification',
    message: '어떤 종류의 옷을 찾고 계세요?',
    suggestion: null,
    recommendations: [],
    comparison: [],
  };
  const { agent, requests, searchCalls } = createMockAgent([
    finalResponse(clarification),
  ]);

  const result = await agent.chat({
    message: '예쁜 옷 추천해줘',
    previousResponseId: 'resp_previous',
  });

  assert.equal(result.type, 'clarification');
  assert.equal(searchCalls.length, 0);
  assert.equal(requests[0].previous_response_id, 'resp_previous');
});

test('returns no_result after a zero-candidate search', async () => {
  const noResult = {
    type: 'no_result',
    message: '조건에 맞는 상품을 찾지 못했어요.',
    suggestion: '가격 범위를 조금 넓혀볼까요?',
    recommendations: [],
    comparison: [],
  };
  const { agent } = createMockAgent(
    [toolResponse(), finalResponse(noResult)],
    { searchResult: { hardFilterMatchCount: 0, candidates: [] } },
  );

  assert.equal((await agent.chat({ message: '천원 이하 바지' })).type, 'no_result');
});

test('rejects recommendation IDs outside the latest search candidates', async () => {
  const { agent } = createMockAgent([
    toolResponse(),
    finalResponse(recommendationOutput('shop:missing')),
  ]);

  await assert.rejects(
    agent.chat({ message: '검정 바지' }),
    (error) =>
      error instanceof AgentRuntimeError &&
      error.code === 'factual_validation_failed',
  );
});

test('stops repeated tool calls at the configured round limit', async () => {
  const { agent } = createMockAgent(
    [toolResponse('resp_1'), toolResponse('resp_2')],
    { config: { ...config, maxToolRounds: 2 } },
  );

  await assert.rejects(
    agent.chat({ message: '검정 바지' }),
    (error) => error instanceof AgentRuntimeError && error.code === 'tool_round_limit',
  );
});
