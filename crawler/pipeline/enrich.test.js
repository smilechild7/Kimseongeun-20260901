import assert from 'node:assert/strict';
import test from 'node:test';

import { AI_CONFIG } from '../../server/config/ai.js';
import { enrichProduct } from './enrich.js';

function fixtureProduct({ reviews = [] } = {}) {
  return {
    source: {
      shopId: 'fixture-shop',
      sourceProductId: '1234',
      productUrl: 'https://shop.example/product/1234',
    },
    name: '편안한 와이드 팬츠',
    category: 'pants',
    description: '여유 있는 일자 실루엣',
    material: '면 100%',
    colors: ['검정'],
    sizes: ['M', 'L'],
    sizeGuideText: 'M 허리 70cm',
    imageUrl: 'https://shop.example/secret-product-image.jpg',
    reviews,
  };
}

function validOutput(reviewCount = 0) {
  return {
    summary: '여유 있는 실루엣의 데일리 팬츠다.',
    styleTags: ['casual', 'minimal'],
    occasionTags: ['daily'],
    fitTags: ['wide'],
    seasonTags: ['all_season'],
    extraTags: ['편안한'],
    reviewSummary: {
      analyzedReviewCount: reviewCount,
      appearanceMatch: { signal: 'unknown', summary: '관련 근거가 없다.' },
      sizeFit: { signal: 'unknown', summary: '관련 근거가 없다.' },
      materialQuality: { signal: 'unknown', summary: '관련 근거가 없다.' },
      positives: [],
      concerns: [],
      similarReviewerNotes: [],
    },
    evidenceTally: {
      appearanceMatch: { similar: 0, different: 0 },
      sizeFit: { runsSmall: 0, trueToSize: 0, runsLarge: 0 },
      materialQuality: { positive: 0, negative: 0 },
    },
  };
}

function mockClient(response, requests = []) {
  return {
    responses: {
      async create(request) {
        requests.push(request);
        return response;
      },
    },
  };
}

function completedResponse(output) {
  return {
    status: 'completed',
    output: [
      {
        type: 'message',
        content: [{ type: 'output_text', text: JSON.stringify(output) }],
      },
    ],
  };
}

test('requests one strict structured response and attaches factual metadata locally', async () => {
  const requests = [];
  const product = fixtureProduct();
  const result = await enrichProduct({
    client: mockClient(completedResponse(validOutput()), requests),
    product,
    now: () => new Date('2026-09-02T12:00:00.000Z'),
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].model, 'gpt-5.6-luna');
  assert.deepEqual(requests[0].reasoning, { effort: 'none' });
  assert.equal(requests[0].text.format.type, 'json_schema');
  assert.equal(requests[0].text.format.strict, true);
  assert.equal(requests[0].store, false);
  assert.equal(requests[0].max_output_tokens, AI_CONFIG.enrichment.maxOutputTokens);
  assert.equal(requests[0].input.length, 2);
  assert.doesNotMatch(requests[0].input[1].content, /secret-product-image/u);

  assert.equal(result.productId, 'fixture-shop:1234');
  assert.equal(result.model, 'gpt-5.6-luna');
  assert.equal(result.promptVersion, 'v2');
  assert.equal(result.enrichedAt, '2026-09-02T12:00:00.000Z');
});

test('derives unknown review signals when a product has no reviews', async () => {
  const output = validOutput();
  output.reviewSummary.sizeFit.signal = 'true_to_size';

  const result = await enrichProduct({
    client: mockClient(completedResponse(output)),
    product: fixtureProduct(),
  });
  assert.equal(result.reviewSummary.sizeFit.signal, 'unknown');
});

test('rejects a review count that differs from the supplied evidence', async () => {
  const product = fixtureProduct({
    reviews: [
      {
        rating: 5,
        text: '편해요',
        optionText: null,
        reviewerProfile: null,
        imageUrls: ['https://shop.example/review.jpg'],
        createdAt: null,
      },
    ],
  });

  await assert.rejects(
    enrichProduct({
      client: mockClient(completedResponse(validOutput(0))),
      product,
    }),
    /analyzedReviewCount must equal supplied review count 1/u,
  );
});

test('rejects incomplete and refused OpenAI responses', async () => {
  const product = fixtureProduct();

  await assert.rejects(
    enrichProduct({
      client: mockClient({
        status: 'incomplete',
        incomplete_details: { reason: 'max_output_tokens' },
      }),
      product,
    }),
    /response incomplete: max_output_tokens/u,
  );

  await assert.rejects(
    enrichProduct({
      client: mockClient({
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [{ type: 'refusal', refusal: 'Cannot process' }],
          },
        ],
      }),
      product,
    }),
    /response refused/u,
  );
});

test('does not allow similar-reviewer notes without structured profile evidence', async () => {
  const product = fixtureProduct({
    reviews: [
      {
        rating: 5,
        text: '키 165인데 잘 맞아요',
        optionText: null,
        reviewerProfile: null,
        createdAt: null,
      },
    ],
  });
  const output = validOutput(1);
  output.reviewSummary.similarReviewerNotes.push({
    profile: '키 165cm',
    note: '잘 맞는다는 의견',
  });

  await assert.rejects(
    enrichProduct({ client: mockClient(completedResponse(output)), product }),
    /require structured reviewer profile evidence/u,
  );
});

test('derives a mixed signal when the evidence tally contains conflict', async () => {
  const product = fixtureProduct({
    reviews: [
      { text: '사진과 같아요', reviewerProfile: null },
      { text: '화면과 달라요', reviewerProfile: null },
    ],
  });
  const output = validOutput(2);
  output.reviewSummary.appearanceMatch = {
    signal: 'similar',
    summary: '비슷하다는 의견과 다르다는 의견이 있다.',
  };
  output.evidenceTally.appearanceMatch = { similar: 1, different: 1 };

  const result = await enrichProduct({
    client: mockClient(completedResponse(output)),
    product,
  });
  assert.equal(result.reviewSummary.appearanceMatch.signal, 'mixed');
});
