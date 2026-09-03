import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  createUsageCollector,
  parseNaturalnessEvalArguments,
} from './runNaturalnessEval.js';

test('requires explicit confirmation, bounded budget, and temporary output', () => {
  const outputPath = path.join(tmpdir(), 'levit-naturalness.json');
  assert.throws(() => parseNaturalnessEvalArguments([]), /confirm-live-eval/u);
  assert.throws(
    () =>
      parseNaturalnessEvalArguments([
        '--confirm-live-eval',
        '--budget-usd=3',
        `--output=${outputPath}`,
      ]),
    /between 0 and 2.5/u,
  );
  assert.throws(
    () =>
      parseNaturalnessEvalArguments([
        '--confirm-live-eval',
        '--budget-usd=2.5',
        '--output=docs/eval.json',
      ]),
    /must stay under/u,
  );

  const options = parseNaturalnessEvalArguments([
    '--confirm-live-eval',
    '--budget-usd=2.5',
    `--output=${outputPath}`,
    '--case=comfortable-size-66-pants',
  ]);
  assert.equal(options.budgetUsd, 2.5);
  assert.equal(options.outputPath, outputPath);
  assert.equal(options.caseId, 'comfortable-size-66-pants');
});

test('captures only the latest completed Agent usage', () => {
  const collector = createUsageCollector();
  collector.logger.log(JSON.stringify({ event: 'search.complete' }));
  collector.logger.log(
    JSON.stringify({
      event: 'agent.complete',
      usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 },
    }),
  );
  assert.deepEqual(collector.takeUsage(), {
    inputTokens: 100,
    outputTokens: 20,
    totalTokens: 120,
  });
  assert.deepEqual(collector.takeUsage(), {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  });
});
