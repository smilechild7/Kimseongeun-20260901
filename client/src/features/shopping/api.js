const DEFAULT_TIMEOUT_MS = 110_000;

export class ChatApiError extends Error {
  constructor(message, { code = 'agent_failed', status = 0, retryAfterSeconds = null } = {}) {
    super(message);
    this.name = 'ChatApiError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function responseBody(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function postChat({
  message,
  previousResponseId = null,
  fetchImpl = fetch,
  signal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort('timeout'), timeoutMs);
  const abortFromParent = () => timeoutController.abort(signal.reason);
  signal?.addEventListener('abort', abortFromParent, { once: true });

  try {
    const response = await fetchImpl('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, previousResponseId }),
      signal: timeoutController.signal,
    });
    const body = await responseBody(response);
    if (!response.ok) {
      const retryAfterHeader = Number(response.headers?.get?.('Retry-After'));
      throw new ChatApiError(body.message || body.error || 'Agent request failed', {
        code: body.error,
        status: response.status,
        retryAfterSeconds:
          body.retryAfterSeconds ??
          (Number.isFinite(retryAfterHeader) ? retryAfterHeader : null),
      });
    }
    return body;
  } catch (error) {
    if (error instanceof ChatApiError) throw error;
    if (timeoutController.signal.aborted) {
      throw new ChatApiError('Agent request was aborted', {
        code: signal?.aborted ? 'request_cancelled' : 'agent_timeout',
      });
    }
    throw new ChatApiError('Agent request could not be completed', {
      code: 'network_error',
    });
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromParent);
  }
}

export function chatErrorMessage(error) {
  if (error?.code === 'rate_limit_exceeded') {
    const wait = error.retryAfterSeconds;
    return wait
      ? `요청이 많아요. 약 ${wait}초 후 다시 시도해주세요.`
      : '요청이 많아요. 잠시 후 다시 시도해주세요.';
  }
  if (error?.code === 'invalid_conversation_state') {
    return '이전 검색이 만료됐어요. 새로 찾기를 눌러 다시 시작해주세요.';
  }
  if (error?.code === 'agent_timeout') {
    return '상품을 확인하는 데 예상보다 오래 걸렸어요. 잠시 후 다시 시도해주세요.';
  }
  if (error?.code === 'agent_unavailable') {
    return '현재 AI 검색을 사용할 수 없어요. 잠시 후 다시 시도해주세요.';
  }
  if (error?.code === 'request_cancelled') return null;
  return '검색 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.';
}

export function isRecoverableChatError(error) {
  return ['agent_response_invalid', 'invalid_response'].includes(error?.code);
}
