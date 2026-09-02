import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRuntimeServices } from '../server/runtime.js';

export const AGENT_INSPECTION_CASES = Object.freeze({
  'office-black': '10만원 이하 출근용 검정 바지. 너무 붙는 건 싫어요.',
  vague: '예쁜 옷 추천해줘',
  'no-result': '1천원 이하 바지 찾아줘',
  'appearance-similar': '사진과 실제 색상이 비슷하다는 후기가 있는 바지 찾아줘',
  'size-28': '평소 28 사이즈인데 허벅지가 너무 붙지 않는 바지 찾아줘',
  comparison: '10만원 이하 출근용 검정 바지 후보 2~3개의 차이를 비교해줘',
});

export function parseArguments(arguments_) {
  const options = {
    caseId: 'office-black',
    message: null,
    previousResponseId: null,
  };

  for (const argument of arguments_) {
    if (argument.startsWith('--case=')) {
      options.caseId = argument.slice('--case='.length);
    } else if (argument.startsWith('--message=')) {
      options.message = argument.slice('--message='.length);
    } else if (argument.startsWith('--previous-response-id=')) {
      options.previousResponseId = argument.slice('--previous-response-id='.length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.message && !AGENT_INSPECTION_CASES[options.caseId]) {
    throw new Error(
      `Unknown case: ${options.caseId}. Available: ${Object.keys(AGENT_INSPECTION_CASES).join(', ')}`,
    );
  }

  return options;
}

export async function inspectAgent({ options, runtime = createRuntimeServices() }) {
  try {
    if (typeof runtime.chat !== 'function') {
      throw new Error('Agent is unavailable. Check OPENAI_API_KEY.');
    }
    return await runtime.chat({
      message: options.message ?? AGENT_INSPECTION_CASES[options.caseId],
      previousResponseId: options.previousResponseId,
    });
  } finally {
    runtime.close();
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await inspectAgent({ options });
  console.log(JSON.stringify(result, null, 2));
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: 'agent.inspect.failed',
        code: error.code ?? error.name ?? 'unknown',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  });
}
