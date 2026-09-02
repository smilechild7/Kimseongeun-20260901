import { colorsMatch, sizesMatch } from '../server/products/searchNormalization.js';

export const FINAL_EVAL_REQUEST_COUNT = 8;

function check(name, passed, detail = null) {
  return { name, passed: Boolean(passed), detail };
}

function evidenceMatchesProduct(product, evidence, criteria) {
  switch (evidence.type) {
    case 'category':
      return product.category === evidence.value;
    case 'price': {
      const required = criteria?.required ?? {};
      const minPrice = required.minPrice ?? null;
      const maxPrice = required.maxPrice ?? null;
      return (
        evidence.value === 'within_required_range' &&
        (minPrice !== null || maxPrice !== null) &&
        (minPrice === null || product.price >= minPrice) &&
        (maxPrice === null || product.price <= maxPrice)
      );
    }
    case 'color':
      return product.colors.some((color) => colorsMatch(color, evidence.value));
    case 'size':
      return product.sizes.some((size) => sizesMatch(size, evidence.value));
    case 'style':
    case 'occasion':
    case 'fit':
    case 'season':
      // Enrichment tags are server-validated but intentionally absent from the
      // public product response, so an external audit cannot re-check them.
      return null;
    case 'review_appearance_match':
      return product.reviewSummary?.appearanceMatch?.signal === evidence.value;
    case 'review_size_fit':
      return product.reviewSummary?.sizeFit?.signal === evidence.value;
    case 'review_material_quality':
      return product.reviewSummary?.materialQuality?.signal === evidence.value;
    default:
      return false;
  }
}

function auditRecommendation(evalCase, response) {
  const products = Array.isArray(response.products) ? response.products : [];
  const ids = products.map(({ id }) => id);
  const checks = [
    check('product_count_1_to_3', products.length >= 1 && products.length <= 3),
    check('unique_product_ids', new Set(ids).size === ids.length),
    check(
      'factual_urls_https',
      products.every(
        ({ imageUrl, productUrl }) =>
          /^https:\/\//u.test(imageUrl) && /^https:\/\//u.test(productUrl),
      ),
    ),
  ];

  if (evalCase.must?.category) {
    checks.push(
      check(
        'required_category',
        products.every(({ category }) => category === evalCase.must.category),
        evalCase.must.category,
      ),
    );
  }
  if (Number.isFinite(evalCase.must?.maxPrice)) {
    checks.push(
      check(
        'required_max_price',
        products.every(({ price }) => price <= evalCase.must.maxPrice),
        evalCase.must.maxPrice,
      ),
    );
  }

  const evidence = products.flatMap((product) =>
    (product.evidence ?? []).map((item) => ({ product, item })),
  );
  const verifiableEvidence = evidence
    .map(({ product, item }) => evidenceMatchesProduct(product, item, response.criteria))
    .filter((matches) => matches !== null);
  checks.push(
    check(
      'all_publicly_verifiable_evidence_matches',
      evidence.length > 0 && verifiableEvidence.every(Boolean),
      `${verifiableEvidence.length}/${evidence.length}`,
    ),
  );

  const comparison = Array.isArray(response.comparison)
    ? response.comparison
    : [];
  checks.push(
    check(
      'comparison_matches_product_count',
      products.length === 1
        ? comparison.length === 0
        : comparison.length === products.length &&
            comparison.every(({ productId }) => ids.includes(productId)),
      comparison.length,
    ),
  );

  if (evalCase.reviewExpectation?.appearanceMatch) {
    const expected = evalCase.reviewExpectation.appearanceMatch;
    checks.push(
      check(
        'requested_appearance_review_signal_present',
        products.some(
          (product) =>
            product.reviewSummary?.appearanceMatch?.signal === expected,
        ),
        expected,
      ),
    );
  }

  if (evalCase.reviewExpectation?.sizeFit === 'not_unknown_when_supported') {
    const supportedCount = products.filter(
      (product) =>
        product.reviewSummary?.sizeFit?.signal &&
        product.reviewSummary.sizeFit.signal !== 'unknown',
    ).length;
    checks.push(
      check(
        'size_fit_signal_coverage_observed',
        true,
        `${supportedCount}/${products.length}`,
      ),
    );
  }

  return { checks, productIds: ids };
}

export function auditEvalResponse(evalCase, response) {
  const checks = [
    check('http_json_object', response !== null && typeof response === 'object'),
    check('expected_response_type', response?.type === evalCase.expectedType),
    check(
      'response_id_present',
      typeof response?.responseId === 'string' && response.responseId.length > 0,
    ),
  ];
  let productIds = [];

  if (response?.type === 'recommendation') {
    const recommendationAudit = auditRecommendation(evalCase, response);
    checks.push(...recommendationAudit.checks);
    productIds = recommendationAudit.productIds;
  } else if (response?.type === 'no_result') {
    checks.push(
      check(
        'relaxation_suggestion_present',
        typeof response.suggestion === 'string' && response.suggestion.length > 0,
      ),
    );
  } else if (response?.type === 'clarification') {
    checks.push(
      check(
        'clarifying_message_present',
        typeof response.message === 'string' && response.message.length > 0,
      ),
    );
  }

  return {
    caseId: evalCase.id,
    expectedType: evalCase.expectedType,
    actualType: response?.type ?? null,
    passed: checks.every(({ passed }) => passed),
    productIds,
    checks,
    manualExpectations: evalCase.semanticExpectations ?? [],
  };
}

export function buildEvalPlan(cases) {
  const baseRequests = cases.map((evalCase) => ({
    evalCase,
    previousCaseId: null,
  }));
  const followUps = cases
    .filter(({ followUp }) => followUp)
    .map(({ id, followUp }) => ({
      evalCase: followUp,
      previousCaseId: id,
    }));
  const plan = [...baseRequests, ...followUps];

  if (plan.length !== FINAL_EVAL_REQUEST_COUNT) {
    throw new Error(
      `Final eval must contain exactly ${FINAL_EVAL_REQUEST_COUNT} logical requests; received ${plan.length}`,
    );
  }
  return plan;
}
