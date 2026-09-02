import { AI_CONFIG } from '../config/ai.js';
import { normalizeSearchInput } from '../products/searchInput.js';
import { SEARCH_PRODUCTS_INPUT_SCHEMA } from '../products/searchSchema.js';
import { SHOPPING_AGENT_INSTRUCTIONS } from './instructions.js';
import { AGENT_OUTPUT_SCHEMA, validateAgentOutput } from './outputContract.js';
import { buildAgentResult } from './resultBuilder.js';

const SEARCH_PRODUCTS_TOOL = Object.freeze({
  type: 'function',
  name: 'search_products',
  description:
    'Search the local catalog using required hard constraints and preferred ranking signals. Returns at most 15 factual compact product candidates with aggregated review evidence.',
  strict: true,
  parameters: SEARCH_PRODUCTS_INPUT_SCHEMA,
});

export class AgentRuntimeError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = 'AgentRuntimeError';
    this.code = code;
  }
}

function toolCalls(response) {
  return (response.output ?? []).filter((item) => item.type === 'function_call');
}

function responseText(response) {
  if (response.status === 'incomplete') {
    throw new AgentRuntimeError(
      'incomplete_response',
      `OpenAI response incomplete: ${response.incomplete_details?.reason ?? 'unknown'}`,
    );
  }

  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === 'refusal') {
        throw new AgentRuntimeError(
          'refused_response',
          'OpenAI response was refused',
        );
      }
      if (content.type === 'output_text' && content.text) {
        return content.text;
      }
    }
  }

  if (typeof response.output_text === 'string' && response.output_text) {
    return response.output_text;
  }

  throw new AgentRuntimeError(
    'missing_output',
    'OpenAI response did not contain a tool call or final output',
  );
}

function parseFinalOutput(response) {
  let value;
  try {
    value = JSON.parse(responseText(response));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AgentRuntimeError(
        'invalid_json',
        'OpenAI final output was not valid JSON',
        { cause: error },
      );
    }
    throw error;
  }

  try {
    return validateAgentOutput(value);
  } catch (error) {
    throw new AgentRuntimeError(
      'invalid_output',
      `OpenAI final output failed validation: ${error.message}`,
      { cause: error },
    );
  }
}

function parseToolInput(toolCall) {
  if (toolCall.name !== 'search_products') {
    throw new AgentRuntimeError(
      'unknown_tool',
      `OpenAI requested an unsupported tool: ${toolCall.name}`,
    );
  }

  let value;
  try {
    value = JSON.parse(toolCall.arguments);
  } catch (error) {
    throw new AgentRuntimeError(
      'invalid_tool_arguments',
      'search_products arguments were not valid JSON',
      { cause: error },
    );
  }

  try {
    return normalizeSearchInput(value);
  } catch (error) {
    throw new AgentRuntimeError(
      'invalid_tool_arguments',
      `search_products arguments failed validation: ${error.message}`,
      { cause: error },
    );
  }
}

function usageTotals(responses) {
  return responses.reduce(
    (total, response) => ({
      inputTokens: total.inputTokens + (response.usage?.input_tokens ?? 0),
      outputTokens: total.outputTokens + (response.usage?.output_tokens ?? 0),
      totalTokens: total.totalTokens + (response.usage?.total_tokens ?? 0),
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  );
}

function requestOptions({ config, input, previousResponseId }) {
  return {
    model: config.model,
    previous_response_id: previousResponseId ?? undefined,
    instructions: SHOPPING_AGENT_INSTRUCTIONS,
    input,
    tools: [SEARCH_PRODUCTS_TOOL],
    tool_choice: 'auto',
    parallel_tool_calls: false,
    text: {
      format: {
        type: 'json_schema',
        name: 'shopping_agent_response',
        strict: true,
        schema: AGENT_OUTPUT_SCHEMA,
      },
    },
    reasoning: { effort: config.reasoningEffort },
    max_output_tokens: config.maxOutputTokens,
    store: true,
  };
}

export function createShoppingAgent({
  client,
  search,
  repository,
  config = AI_CONFIG.agent,
  logger = console,
}) {
  if (!client?.responses?.create) {
    throw new Error('Shopping Agent requires an OpenAI Responses client');
  }
  if (typeof search !== 'function') {
    throw new Error('Shopping Agent requires a search executor');
  }

  return {
    async chat({ message, previousResponseId = null }) {
      const responses = [];
      let priorId = previousResponseId;
      let nextInput = [{ role: 'user', content: message }];
      let latestSearch = null;

      for (let round = 0; round < config.maxToolRounds; round += 1) {
        const response = await client.responses.create(
          requestOptions({ config, input: nextInput, previousResponseId: priorId }),
        );
        responses.push(response);

        const calls = toolCalls(response);
        if (calls.length > 1) {
          throw new AgentRuntimeError(
            'multiple_tool_calls',
            'OpenAI returned more than one tool call in a round',
          );
        }

        if (calls.length === 0) {
          const output = parseFinalOutput(response);
          let result;
          try {
            result = buildAgentResult({
              output,
              responseId: response.id,
              latestSearch,
              repository,
            });
          } catch (error) {
            throw new AgentRuntimeError(
              'factual_validation_failed',
              `Agent factual validation failed: ${error.message}`,
              { cause: error },
            );
          }

          logger.log(
            JSON.stringify({
              event: 'agent.complete',
              type: result.type,
              rounds: responses.length,
              candidateCount: latestSearch?.result.candidates.length ?? 0,
              recommendationCount: result.products?.length ?? 0,
              usage: usageTotals(responses),
            }),
          );
          return result;
        }

        if (round === config.maxToolRounds - 1) {
          throw new AgentRuntimeError(
            'tool_round_limit',
            `OpenAI exceeded the ${config.maxToolRounds}-round limit`,
          );
        }

        const call = calls[0];
        const normalizedInput = parseToolInput(call);
        const searchResult = search(normalizedInput);
        latestSearch = { input: normalizedInput, result: searchResult };
        priorId = response.id;
        nextInput = [
          {
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(searchResult),
          },
        ];
      }

      throw new AgentRuntimeError(
        'tool_round_limit',
        `OpenAI exceeded the ${config.maxToolRounds}-round limit`,
      );
    },
  };
}

export { SEARCH_PRODUCTS_TOOL };
