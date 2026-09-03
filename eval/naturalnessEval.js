import { auditEvalResponse } from './finalEval.js';
import { colorsMatch, normalizeText } from '../server/products/searchNormalization.js';

export const NATURALNESS_EVAL_REQUEST_COUNT = 20;
export const NATURALNESS_EVAL_MAX_BUDGET_USD = 2.5;
export const NEXT_REQUEST_RESERVE_USD = 0.35;

const INPUT_USD_PER_TOKEN = 4 / 1_000_000;
const OUTPUT_USD_PER_TOKEN = 20 / 1_000_000;

function check(name, passed, detail = null) {
  return { name, passed: Boolean(passed), detail };
}

function containsColor(values, expected) {
  return (values ?? []).some((value) => colorsMatch(value, expected));
}

function auditColorPolicy(evalCase, response) {
  const policy = evalCase.colorPolicy;
  if (!policy || response.type !== 'recommendation') return [];

  const requiredColors = response.criteria?.required?.colors ?? [];
  const preferredColors = response.criteria?.preferred?.colors ?? [];
  const products = response.products ?? [];

  if (policy.mode === 'strict') {
    return [
      check(
        'strict_color_remains_required',
        containsColor(requiredColors, policy.requested),
        requiredColors,
      ),
      check(
        'strict_color_products_are_exact',
        products.length > 0 &&
          products.every(({ colors }) => containsColor(colors, policy.requested)),
      ),
    ];
  }

  const acceptedColors = [policy.requested, ...policy.alternatives];
  const message = normalizeText(response.message);
  const hasAlternativeProduct = products.some(
    ({ colors }) =>
      !containsColor(colors, policy.requested) &&
      policy.alternatives.some((color) => containsColor(colors, color)),
  );

  return [
    check('soft_color_not_required', requiredColors.length === 0, requiredColors),
    check(
      'relaxed_preference_preserves_requested_color',
      containsColor(preferredColors, policy.requested),
      preferredColors,
    ),
    check(
      'relaxed_preference_contains_all_alternatives',
      policy.alternatives.every((color) =>
        containsColor(preferredColors, color),
      ),
      preferredColors,
    ),
    check(
      'relaxed_products_use_only_controlled_colors',
      products.length > 0 &&
        products.every(({ colors }) =>
          acceptedColors.some((color) => containsColor(colors, color)),
        ),
    ),
    check('relaxed_result_includes_alternative', hasAlternativeProduct),
    check(
      'relaxation_is_disclosed',
      /(화이트|흰색)/u.test(message) &&
        /(아이보리|크림)/u.test(message) &&
        /(부족|넓|대신|가까)/u.test(message),
      response.message,
    ),
  ];
}

export function estimateAgentCostUsd(usage) {
  return (
    (usage?.inputTokens ?? 0) * INPUT_USD_PER_TOKEN +
    (usage?.outputTokens ?? 0) * OUTPUT_USD_PER_TOKEN
  );
}

export function auditNaturalnessResponse(evalCase, response) {
  const base = auditEvalResponse(evalCase, response);
  const checks = [...base.checks, ...auditColorPolicy(evalCase, response)];
  return {
    ...base,
    passed: checks.every(({ passed }) => passed),
    checks,
  };
}

export function validateNaturalnessCases(cases) {
  if (!Array.isArray(cases) || cases.length !== NATURALNESS_EVAL_REQUEST_COUNT) {
    throw new Error(
      `Naturalness eval requires exactly ${NATURALNESS_EVAL_REQUEST_COUNT} cases`,
    );
  }
  const ids = new Set();
  for (const [index, evalCase] of cases.entries()) {
    if (!evalCase || typeof evalCase !== 'object') {
      throw new Error(`cases[${index}] must be an object`);
    }
    if (typeof evalCase.id !== 'string' || ids.has(evalCase.id)) {
      throw new Error(`cases[${index}].id must be a unique string`);
    }
    ids.add(evalCase.id);
    if (typeof evalCase.query !== 'string' || evalCase.query.trim() === '') {
      throw new Error(`cases[${index}].query must be a non-empty string`);
    }
    if (
      !['clarification', 'recommendation', 'no_result'].includes(
        evalCase.expectedType,
      )
    ) {
      throw new Error(`cases[${index}].expectedType is invalid`);
    }
  }
  return cases;
}

export async function runNaturalnessEval({
  cases,
  caseIds = null,
  chat,
  takeUsage,
  budgetUsd = NATURALNESS_EVAL_MAX_BUDGET_USD,
  onProgress = () => {},
}) {
  validateNaturalnessCases(cases);
  const selectedCases = caseIds
    ? cases.filter(({ id }) => caseIds.includes(id))
    : cases;
  if (caseIds && selectedCases.length !== new Set(caseIds).size) {
    throw new Error('One or more requested naturalness eval case IDs are unknown');
  }
  const results = [];
  let estimatedCostUsd = 0;

  for (const [index, evalCase] of selectedCases.entries()) {
    if (estimatedCostUsd + NEXT_REQUEST_RESERVE_USD > budgetUsd) {
      results.push({
        caseId: evalCase.id,
        skipped: 'budget_reserve',
      });
      continue;
    }

    const startedAt = Date.now();
    try {
      const response = await chat({ message: evalCase.query });
      const usage = takeUsage();
      const costUsd = estimateAgentCostUsd(usage);
      estimatedCostUsd += costUsd;
      const audit = auditNaturalnessResponse(evalCase, response);
      const result = {
        caseId: evalCase.id,
        query: evalCase.query,
        response,
        usage,
        estimatedCostUsd: costUsd,
        audit,
        elapsedMs: Date.now() - startedAt,
      };
      results.push(result);
      onProgress({
        index: index + 1,
        total: selectedCases.length,
        caseId: evalCase.id,
        passed: audit.passed,
        responseType: response.type,
        estimatedCostUsd: costUsd,
        cumulativeEstimatedCostUsd: estimatedCostUsd,
      });
    } catch (error) {
      const usage = takeUsage();
      const measuredCostUsd = estimateAgentCostUsd(usage);
      const costUsd =
        (usage?.totalTokens ?? 0) > 0
          ? measuredCostUsd
          : NEXT_REQUEST_RESERVE_USD;
      estimatedCostUsd += costUsd;
      const result = {
        caseId: evalCase.id,
        query: evalCase.query,
        error: error.message,
        errorCode: error.code ?? null,
        usage,
        estimatedCostUsd: costUsd,
        costUsesSafetyReserve: measuredCostUsd === 0,
        elapsedMs: Date.now() - startedAt,
      };
      results.push(result);
      onProgress({
        index: index + 1,
        total: selectedCases.length,
        caseId: evalCase.id,
        passed: false,
        error: result.error,
        estimatedCostUsd: costUsd,
        cumulativeEstimatedCostUsd: estimatedCostUsd,
      });
    }
  }

  return {
    executedAt: new Date().toISOString(),
    budgetUsd,
    estimatedCostUsd,
    attemptedRequests: results.filter(({ skipped }) => !skipped).length,
    skippedRequests: results.filter(({ skipped }) => skipped).length,
    results,
  };
}
