export function previousAssistantResponses(messages, { includeLatest = false } = {}) {
  const assistantMessages = messages.filter((message) => message.role === 'assistant');
  const latestAssistantMessage = assistantMessages.at(-1);
  const entries = [];
  let latestUserMessage = null;

  messages.forEach((message, index) => {
    if (message.role === 'user') {
      latestUserMessage = message;
      return;
    }
    if (message.role !== 'assistant') return;
    if (!includeLatest && message === latestAssistantMessage) return;

    entries.push({
      key: message.data?.responseId ?? `assistant-${index}`,
      message,
      userMessage: latestUserMessage,
    });
  });

  return entries;
}
