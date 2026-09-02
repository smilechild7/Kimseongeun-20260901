import { Router } from 'express';
import { AgentRuntimeError } from '../agent/shoppingAgent.js';
import { validateChatRequest } from '../agent/chatRequest.js';

function upstreamStatus(error, hasPreviousResponseId) {
  if (error instanceof AgentRuntimeError) {
    return 502;
  }
  if (error?.status === 401 || error?.status === 403) {
    return 503;
  }
  if (error?.status === 400 && hasPreviousResponseId) {
    return 400;
  }
  if (error?.name === 'APIConnectionTimeoutError') {
    return 504;
  }
  return 502;
}

function publicError(status) {
  if (status === 400) return 'invalid_conversation_state';
  if (status === 503) return 'agent_unavailable';
  if (status === 504) return 'agent_timeout';
  return 'agent_failed';
}

export function createChatRouter({
  chat,
  rateLimiters = [],
  maxMessageLength,
  logger = console,
}) {
  const router = Router();

  router.post('/', ...rateLimiters, async (request, response) => {
    let input;
    try {
      input = validateChatRequest(request.body, { maxMessageLength });
    } catch (error) {
      response.status(400).json({
        error: 'invalid_request',
        message: error.message,
      });
      return;
    }

    if (typeof chat !== 'function') {
      response.status(503).json({ error: 'agent_unavailable' });
      return;
    }

    try {
      response.status(200).json(await chat(input));
    } catch (error) {
      const status = upstreamStatus(error, input.previousResponseId !== null);
      logger.error(
        JSON.stringify({
          event: 'agent.failed',
          code: error.code ?? error.name ?? 'unknown',
          upstreamStatus: error.status ?? null,
          httpStatus: status,
        }),
      );
      response.status(status).json({ error: publicError(status) });
    }
  });

  return router;
}
