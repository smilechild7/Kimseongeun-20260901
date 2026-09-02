import { rateLimit } from 'express-rate-limit';

function retryAfterSeconds(request) {
  const resetTime = request.rateLimit?.resetTime;
  if (!(resetTime instanceof Date)) {
    return null;
  }

  return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1_000));
}

function handler(scope) {
  return (request, response) => {
    const retryAfter = retryAfterSeconds(request);
    if (retryAfter !== null) {
      response.set('Retry-After', String(retryAfter));
    }
    response.status(429).json({
      error: 'rate_limit_exceeded',
      scope,
      retryAfterSeconds: retryAfter,
    });
  };
}

export function createChatRateLimiters({ client, service }) {
  const shared = {
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
  };

  return [
    rateLimit({
      ...shared,
      windowMs: client.windowMs,
      limit: client.limit,
      ipv6Subnet: 56,
      handler: handler('client'),
    }),
    rateLimit({
      ...shared,
      windowMs: service.windowMs,
      limit: service.limit,
      keyGenerator: () => 'service',
      validate: { keyGeneratorIpFallback: false },
      handler: handler('service'),
    }),
  ];
}
