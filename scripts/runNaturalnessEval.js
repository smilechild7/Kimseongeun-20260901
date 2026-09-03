import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  NATURALNESS_EVAL_MAX_BUDGET_USD,
  runNaturalnessEval,
  validateNaturalnessCases,
} from '../eval/naturalnessEval.js';
import { createRuntimeServices } from '../server/runtime.js';

export function parseNaturalnessEvalArguments(arguments_) {
  const options = {
    confirmed: false,
    budgetUsd: null,
    outputPath: null,
    caseId: null,
  };

  for (const argument of arguments_) {
    if (argument === '--confirm-live-eval') {
      options.confirmed = true;
    } else if (argument.startsWith('--budget-usd=')) {
      options.budgetUsd = Number(argument.slice('--budget-usd='.length));
    } else if (argument.startsWith('--output=')) {
      options.outputPath = path.resolve(argument.slice('--output='.length));
    } else if (argument.startsWith('--case=')) {
      options.caseId = argument.slice('--case='.length).trim();
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.confirmed) {
    throw new Error('Live naturalness eval requires --confirm-live-eval');
  }
  if (
    !Number.isFinite(options.budgetUsd) ||
    options.budgetUsd <= 0 ||
    options.budgetUsd > NATURALNESS_EVAL_MAX_BUDGET_USD
  ) {
    throw new Error(
      `Live naturalness eval budget must be between 0 and ${NATURALNESS_EVAL_MAX_BUDGET_USD}`,
    );
  }
  const temporaryRoot = path.resolve(tmpdir());
  if (
    !options.outputPath ||
    (!options.outputPath.startsWith(`${temporaryRoot}${path.sep}`) &&
      options.outputPath !== temporaryRoot)
  ) {
    throw new Error(`Raw eval output must stay under ${temporaryRoot}`);
  }
  if (options.caseId === '') {
    throw new Error('Naturalness eval --case must not be empty');
  }
  return options;
}

export function createUsageCollector() {
  let latestUsage = null;
  return {
    logger: {
      log(value) {
        try {
          const event = JSON.parse(value);
          if (['agent.complete', 'agent.failed'].includes(event.event)) {
            latestUsage = event.usage;
          }
        } catch {
          // Ignore non-JSON dependency logs without exposing them in eval output.
        }
      },
      warn() {},
    },
    takeUsage() {
      const usage = latestUsage ?? {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };
      latestUsage = null;
      return usage;
    },
  };
}

export async function executeNaturalnessEval({
  options,
  runtimeFactory = createRuntimeServices,
  casesUrl = new URL('../eval/naturalnessCases.json', import.meta.url),
  onProgress = () => {},
}) {
  const cases = validateNaturalnessCases(
    JSON.parse(await readFile(casesUrl, 'utf8')),
  );
  const usageCollector = createUsageCollector();
  const runtime = runtimeFactory({ logger: usageCollector.logger });
  try {
    if (typeof runtime.chat !== 'function') {
      throw new Error('Agent is unavailable. Check OPENAI_API_KEY.');
    }
    const output = await runNaturalnessEval({
      cases,
      caseIds: options.caseId ? [options.caseId] : null,
      chat: runtime.chat,
      takeUsage: usageCollector.takeUsage,
      budgetUsd: options.budgetUsd,
      onProgress,
    });
    await writeFile(options.outputPath, `${JSON.stringify(output, null, 2)}\n`, {
      mode: 0o600,
    });
    return output;
  } finally {
    runtime.close();
  }
}

async function main() {
  const options = parseNaturalnessEvalArguments(process.argv.slice(2));
  const output = await executeNaturalnessEval({
    options,
    onProgress(progress) {
      console.log(JSON.stringify({ event: 'naturalness.eval.progress', ...progress }));
    },
  });
  console.log(
    JSON.stringify({
      event: 'naturalness.eval.complete',
      attemptedRequests: output.attemptedRequests,
      skippedRequests: output.skippedRequests,
      passedAudits: output.results.filter(({ audit }) => audit?.passed).length,
      failedAudits: output.results.filter(({ audit }) => audit && !audit.passed).length,
      errors: output.results.filter(({ error }) => error).length,
      estimatedCostUsd: output.estimatedCostUsd,
      rawOutputPath: options.outputPath,
    }),
  );
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: 'naturalness.eval.failed',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  });
}
