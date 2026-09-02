import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  auditEvalResponse,
  buildEvalPlan,
  FINAL_EVAL_REQUEST_COUNT,
} from '../eval/finalEval.js';

const REQUEST_TIMEOUT_MS = 120_000;

export function parseFinalEvalArguments(arguments_) {
  const options = {
    baseUrl: null,
    outputPath: null,
    confirmed: false,
  };

  for (const argument of arguments_) {
    if (argument.startsWith('--base-url=')) {
      options.baseUrl = argument.slice('--base-url='.length).replace(/\/$/u, '');
    } else if (argument.startsWith('--output=')) {
      options.outputPath = path.resolve(argument.slice('--output='.length));
    } else if (argument === '--confirm-live-eval') {
      options.confirmed = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.confirmed) {
    throw new Error('Live eval requires --confirm-live-eval');
  }
  if (!options.baseUrl || !/^https:\/\//u.test(options.baseUrl)) {
    throw new Error('Live eval requires an explicit HTTPS --base-url');
  }
  const temporaryRoot = path.resolve(tmpdir());
  if (
    !options.outputPath ||
    (!options.outputPath.startsWith(`${temporaryRoot}${path.sep}`) &&
      options.outputPath !== temporaryRoot)
  ) {
    throw new Error(`Raw eval output must stay under ${temporaryRoot}`);
  }

  return options;
}

async function postChat({ baseUrl, message, previousResponseId }) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message,
      ...(previousResponseId ? { previousResponseId } : {}),
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.httpStatus = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export async function runFinalEval({ baseUrl, cases, onProgress = () => {} }) {
  const plan = buildEvalPlan(cases);
  const responseIds = new Map();
  const results = [];

  for (const [index, request] of plan.entries()) {
    const startedAt = Date.now();
    const previousResponseId = request.previousCaseId
      ? responseIds.get(request.previousCaseId)
      : null;

    if (request.previousCaseId && !previousResponseId) {
      const skipped = {
        caseId: request.evalCase.id,
        error: 'missing_previous_response',
        elapsedMs: Date.now() - startedAt,
      };
      results.push(skipped);
      onProgress({ index: index + 1, total: plan.length, ...skipped });
      continue;
    }

    try {
      const response = await postChat({
        baseUrl,
        message: request.evalCase.query,
        previousResponseId,
      });
      responseIds.set(request.evalCase.id, response.responseId);
      const audit = auditEvalResponse(request.evalCase, response);
      const result = {
        caseId: request.evalCase.id,
        query: request.evalCase.query,
        previousCaseId: request.previousCaseId,
        response,
        audit,
        elapsedMs: Date.now() - startedAt,
      };
      results.push(result);
      onProgress({
        index: index + 1,
        total: plan.length,
        caseId: request.evalCase.id,
        passed: audit.passed,
        actualType: audit.actualType,
        productIds: audit.productIds,
        elapsedMs: result.elapsedMs,
      });
    } catch (error) {
      const result = {
        caseId: request.evalCase.id,
        query: request.evalCase.query,
        previousCaseId: request.previousCaseId,
        error: error.message,
        httpStatus: error.httpStatus ?? null,
        errorBody: error.body ?? null,
        elapsedMs: Date.now() - startedAt,
      };
      results.push(result);
      onProgress({
        index: index + 1,
        total: plan.length,
        caseId: request.evalCase.id,
        passed: false,
        error: result.error,
        httpStatus: result.httpStatus,
        elapsedMs: result.elapsedMs,
      });
    }
  }

  return {
    executedAt: new Date().toISOString(),
    baseUrl,
    logicalRequestLimit: FINAL_EVAL_REQUEST_COUNT,
    attemptedRequests: results.filter(({ error }) => error !== 'missing_previous_response')
      .length,
    results,
  };
}

async function main() {
  const options = parseFinalEvalArguments(process.argv.slice(2));
  const cases = JSON.parse(
    await readFile(new URL('../eval/cases.json', import.meta.url), 'utf8'),
  );
  const output = await runFinalEval({
    baseUrl: options.baseUrl,
    cases,
    onProgress(progress) {
      console.log(JSON.stringify({ event: 'eval.progress', ...progress }));
    },
  });
  await writeFile(options.outputPath, `${JSON.stringify(output, null, 2)}\n`, {
    mode: 0o600,
  });

  const audits = output.results.map(({ audit }) => audit).filter(Boolean);
  const passed =
    output.attemptedRequests === FINAL_EVAL_REQUEST_COUNT &&
    audits.length === FINAL_EVAL_REQUEST_COUNT &&
    audits.every((audit) => audit.passed);
  console.log(
    JSON.stringify({
      event: 'eval.complete',
      attemptedRequests: output.attemptedRequests,
      passedAudits: audits.filter((audit) => audit.passed).length,
      failedAudits: audits.filter((audit) => !audit.passed).length,
      rawOutputPath: options.outputPath,
    }),
  );
  if (!passed) process.exitCode = 1;
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: 'eval.failed',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  });
}
