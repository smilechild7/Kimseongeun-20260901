import { AI_CONFIG } from '../../server/config/ai.js';
import {
  MODEL_ENRICHMENT_OUTPUT_SCHEMA,
  validateEnrichmentOutput,
  validateModelEnrichmentOutput,
} from './enrichmentContract.js';
import { ENRICHMENT_INSTRUCTIONS, enrichmentInput } from './enrichmentPrompt.js';
import { applyEnrichmentOverrides } from './enrichmentOverrides.js';

function responseText(response) {
  if (response.status === 'incomplete') {
    const reason = response.incomplete_details?.reason ?? 'unknown';
    throw new Error(`OpenAI response incomplete: ${reason}`);
  }

  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === 'refusal') {
        throw new Error(`OpenAI response refused: ${content.refusal}`);
      }
      if (content.type === 'output_text' && content.text) {
        return content.text;
      }
    }
  }

  if (typeof response.output_text === 'string' && response.output_text) {
    return response.output_text;
  }

  throw new Error('OpenAI response did not contain output text');
}

export async function enrichProduct({
  client,
  product,
  config = AI_CONFIG.enrichment,
  now = () => new Date(),
  onUsage = () => {},
}) {
  const response = await client.responses.create({
    model: config.model,
    input: [
      { role: 'system', content: ENRICHMENT_INSTRUCTIONS },
      { role: 'user', content: enrichmentInput(product) },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'product_enrichment',
        strict: true,
        schema: MODEL_ENRICHMENT_OUTPUT_SCHEMA,
      },
    },
    reasoning: { effort: config.reasoningEffort },
    max_output_tokens: config.maxOutputTokens,
    store: false,
  });
  onUsage({
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    totalTokens: response.usage?.total_tokens ?? 0,
  });

  let output;
  try {
    output = JSON.parse(responseText(response));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('OpenAI response was not valid JSON', { cause: error });
    }
    throw error;
  }

  const productId = `${product.source.shopId}:${product.source.sourceProductId}`;
  const validatedOutput = validateModelEnrichmentOutput(output, product);
  const curatedOutput = applyEnrichmentOverrides(productId, validatedOutput);
  validateEnrichmentOutput(curatedOutput, product);

  return {
    productId,
    ...curatedOutput,
    model: config.model,
    promptVersion: config.promptVersion,
    enrichedAt: now().toISOString(),
  };
}
