import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  auditEvalResponse,
  buildEvalPlan,
  FINAL_EVAL_REQUEST_COUNT,
} from './finalEval.js';

test('final eval plan contains seven independent requests and one linked follow-up', async () => {
  const cases = JSON.parse(
    await readFile(new URL('./cases.json', import.meta.url), 'utf8'),
  );
  const plan = buildEvalPlan(cases);

  assert.equal(plan.length, FINAL_EVAL_REQUEST_COUNT);
  assert.equal(plan.filter(({ previousCaseId }) => previousCaseId).length, 1);
  assert.equal(
    plan.at(-1).previousCaseId,
    'office-black-under-100k',
  );
});

test('recommendation audit rejects factual evidence that is absent from product data', () => {
  const baseResponse = {
    type: 'recommendation',
    responseId: 'resp_test',
    criteria: {
      required: { minPrice: null, maxPrice: 100000 },
    },
    products: [
      {
        id: 'shop:1',
        category: 'pants',
        price: 50000,
        imageUrl: 'https://example.com/image.jpg',
        productUrl: 'https://example.com/product/1',
        colors: ['블랙'],
        sizes: ['28'],
        styleTags: [],
        occasionTags: ['office'],
        fitTags: ['relaxed'],
        seasonTags: [],
        reviewSummary: {
          appearanceMatch: { signal: 'similar' },
          sizeFit: { signal: 'true_to_size' },
          materialQuality: { signal: 'positive' },
        },
        evidence: [{ type: 'category', value: 'pants' }],
      },
    ],
    comparison: [],
  };
  const evalCase = {
    id: 'test',
    expectedType: 'recommendation',
    must: { category: 'pants', maxPrice: 100000 },
  };

  assert.equal(auditEvalResponse(evalCase, baseResponse).passed, true);

  const invalid = structuredClone(baseResponse);
  invalid.products[0].evidence[0].value = 'dress';
  const audit = auditEvalResponse(evalCase, invalid);
  assert.equal(audit.passed, false);
  assert.equal(
    audit.checks.find(
      ({ name }) => name === 'all_publicly_verifiable_evidence_matches',
    ).passed,
    false,
  );
});

test('clarification and no-result audits enforce their public contracts', () => {
  assert.equal(
    auditEvalResponse(
      { id: 'vague', expectedType: 'clarification' },
      { type: 'clarification', responseId: 'resp_1', message: '질문' },
    ).passed,
    true,
  );
  assert.equal(
    auditEvalResponse(
      { id: 'none', expectedType: 'no_result' },
      {
        type: 'no_result',
        responseId: 'resp_2',
        message: '없음',
        suggestion: '',
      },
    ).passed,
    false,
  );
});
