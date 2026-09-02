export const CHAT_CONFIG = Object.freeze({
  jsonBodyLimit: '16kb',
  maxMessageLength: 1_000,
  clientRateLimit: Object.freeze({
    windowMs: 10 * 60 * 1_000,
    limit: 10,
  }),
  serviceRateLimit: Object.freeze({
    windowMs: 60 * 60 * 1_000,
    limit: 30,
  }),
});
