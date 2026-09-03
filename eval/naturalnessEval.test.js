import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  auditNaturalnessResponse,
  estimateAgentCostUsd,
  NATURALNESS_EVAL_REQUEST_COUNT,
  runNaturalnessEval,
  validateNaturalnessCases,
} from './naturalnessEval.js';

const baseProduct = {
  id: 'shop:1',
  category: 'dress',
  price: 50000,
  imageUrl: 'https://example.com/image.jpg',
  productUrl: 'https://example.com/product/1',
  colors: ['크림'],
  sizes: ['M'],
  reviewSummary: {
    appearanceMatch: { signal: 'unknown' },
    sizeFit: { signal: 'unknown' },
    materialQuality: { signal: 'unknown' },
  },
  evidence: [{ type: 'color', value: '크림' }],
};

function softRelaxationResponse() {
  return {
    type: 'recommendation',
    responseId: 'resp_test',
    message: '정확한 화이트가 부족해 아이보리와 크림까지 넓혀봤어요.',
    criteria: {
      required: {
        category: 'dress',
        minPrice: null,
        maxPrice: null,
        colors: [],
        sizes: [],
      },
      preferred: { colors: ['white', 'ivory', 'cream'] },
    },
    products: [structuredClone(baseProduct)],
    comparison: [],
  };
}

test('defines exactly twenty unique naturalness cases', async () => {
  const cases = JSON.parse(
    await readFile(new URL('./naturalnessCases.json', import.meta.url), 'utf8'),
  );
  assert.equal(validateNaturalnessCases(cases).length, NATURALNESS_EVAL_REQUEST_COUNT);
});

test('audits controlled soft color relaxation and disclosure', () => {
  const evalCase = {
    id: 'soft-white',
    expectedType: 'recommendation',
    must: { category: 'dress' },
    colorPolicy: {
      mode: 'soft_relaxation',
      requested: 'white',
      alternatives: ['ivory', 'cream'],
    },
  };
  assert.equal(
    auditNaturalnessResponse(evalCase, softRelaxationResponse()).passed,
    true,
  );

  const undisclosed = softRelaxationResponse();
  undisclosed.message = '추천 결과입니다.';
  const audit = auditNaturalnessResponse(evalCase, undisclosed);
  assert.equal(audit.passed, false);
  assert.equal(
    audit.checks.find(({ name }) => name === 'relaxation_is_disclosed').passed,
    false,
  );
});

test('audits strict white as required and rejects a cream substitute', () => {
  const evalCase = {
    id: 'strict-white',
    expectedType: 'recommendation',
    must: { category: 'dress' },
    colorPolicy: {
      mode: 'strict',
      requested: 'white',
      alternatives: ['ivory', 'cream'],
    },
  };
  const response = softRelaxationResponse();
  response.criteria.required.colors = ['white'];
  response.criteria.preferred.colors = ['white'];
  response.products[0].colors = ['화이트'];
  response.products[0].evidence[0].value = '화이트';
  assert.equal(auditNaturalnessResponse(evalCase, response).passed, true);

  response.products[0].colors = ['크림'];
  assert.equal(auditNaturalnessResponse(evalCase, response).passed, false);
});

test('tracks conservative token cost and stops before the next budget reserve', async () => {
  const cases = Array.from({ length: NATURALNESS_EVAL_REQUEST_COUNT }, (_, index) => ({
    id: `case-${index}`,
    query: `원피스 ${index}`,
    expectedType: 'recommendation',
  }));
  let usage = null;
  const output = await runNaturalnessEval({
    cases,
    budgetUsd: 0.5,
    async chat() {
      usage = { inputTokens: 10_000, outputTokens: 1_000, totalTokens: 11_000 };
      return softRelaxationResponse();
    },
    takeUsage() {
      const value = usage;
      usage = null;
      return value;
    },
  });

  assert.equal(estimateAgentCostUsd({ inputTokens: 10_000, outputTokens: 1_000 }), 0.06);
  assert.equal(output.attemptedRequests, 3);
  assert.equal(output.skippedRequests, 17);
  assert.ok(output.estimatedCostUsd <= output.budgetUsd);
});

test('charges the safety reserve when an error has no observable token usage', async () => {
  const cases = Array.from({ length: NATURALNESS_EVAL_REQUEST_COUNT }, (_, index) => ({
    id: `error-${index}`,
    query: `상의 ${index}`,
    expectedType: 'recommendation',
  }));
  const output = await runNaturalnessEval({
    cases,
    budgetUsd: 0.7,
    async chat() {
      throw new Error('factual validation failed');
    },
    takeUsage() {
      return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    },
  });

  assert.equal(output.attemptedRequests, 2);
  assert.equal(output.results[0].estimatedCostUsd, 0.35);
  assert.equal(output.results[0].costUsesSafetyReserve, true);
  assert.equal(output.estimatedCostUsd, 0.7);
});

test('runs only explicitly selected case IDs from the validated suite', async () => {
  const cases = Array.from({ length: NATURALNESS_EVAL_REQUEST_COUNT }, (_, index) => ({
    id: `selected-${index}`,
    query: `스커트 ${index}`,
    expectedType: 'recommendation',
  }));
  const called = [];
  const output = await runNaturalnessEval({
    cases,
    caseIds: ['selected-7'],
    budgetUsd: 0.35,
    async chat({ message }) {
      called.push(message);
      return softRelaxationResponse();
    },
    takeUsage() {
      return { inputTokens: 100, outputTokens: 20, totalTokens: 120 };
    },
  });

  assert.deepEqual(called, ['스커트 7']);
  assert.equal(output.attemptedRequests, 1);
  await assert.rejects(
    runNaturalnessEval({
      cases,
      caseIds: ['missing'],
      chat: async () => softRelaxationResponse(),
      takeUsage: () => ({ inputTokens: 0, outputTokens: 0, totalTokens: 0 }),
    }),
    /unknown/u,
  );
});
