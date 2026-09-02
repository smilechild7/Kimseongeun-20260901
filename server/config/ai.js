export const AI_CONFIG = Object.freeze({
  agent: Object.freeze({
    model: 'gpt-5.6-sol',
    reasoningEffort: 'low',
    maxToolRounds: 3,
  }),
  enrichment: Object.freeze({
    model: 'gpt-5.6-luna',
    reasoningEffort: 'none',
    maxOutputTokens: 1800,
    promptVersion: 'v2',
    maxRetries: 2,
    timeoutMs: 60_000,
  }),
});
