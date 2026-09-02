const RESPONSE_ID_PATTERN = /^resp_[A-Za-z0-9_-]{1,200}$/u;

export function validateChatRequest(value, { maxMessageLength }) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('request body must be an object');
  }

  const keys = Object.keys(value).sort();
  const allowedKeys = ['message', 'previousResponseId'];
  if (keys.some((key) => !allowedKeys.includes(key))) {
    throw new Error('request body contains unsupported fields');
  }

  if (typeof value.message !== 'string') {
    throw new Error('message must be a string');
  }
  const message = value.message.trim();
  if (message.length === 0 || message.length > maxMessageLength) {
    throw new Error(`message must contain 1-${maxMessageLength} characters`);
  }

  const previousResponseId = value.previousResponseId ?? null;
  if (
    previousResponseId !== null &&
    (typeof previousResponseId !== 'string' ||
      !RESPONSE_ID_PATTERN.test(previousResponseId))
  ) {
    throw new Error('previousResponseId is invalid');
  }

  return { message, previousResponseId };
}
