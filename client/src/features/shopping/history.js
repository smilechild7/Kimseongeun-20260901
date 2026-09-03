export function previousRecommendations(messages, { includeLatest = false } = {}) {
  const assistantMessages = messages.filter((message) => message.role === 'assistant');
  const latestAssistantMessage = assistantMessages.at(-1);

  return assistantMessages
    .map((message, index) => ({
      key: message.data?.responseId ?? `assistant-${index}`,
      message,
    }))
    .filter(({ message }) => (
      message.kind === 'recommendation' &&
      (includeLatest || message !== latestAssistantMessage)
    ))
    .reverse();
}
