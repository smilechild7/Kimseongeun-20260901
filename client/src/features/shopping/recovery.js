const CATEGORY_QUESTION_PATTERN =
  /(옷의 종류|종류의 옷|카테고리|원피스|상의|바지|스커트|아우터)/u;

export function recoveryQuestion(previousAssistantMessage) {
  const previousQuestion = previousAssistantMessage?.data?.message ?? '';

  if (
    previousAssistantMessage?.kind === 'clarification' &&
    CATEGORY_QUESTION_PATTERN.test(previousQuestion)
  ) {
    return '한 번에 한 종류씩 찾아볼게요. 원피스, 상의, 바지, 스커트, 아우터 중 먼저 찾을 한 가지를 골라주세요.';
  }

  if (previousAssistantMessage?.kind === 'clarification') {
    return '답변을 조금 다르게 한 번 더 알려주세요. 한 가지 조건부터 짧게 말씀해주시면 다시 찾아볼게요.';
  }

  return '조건을 조금 다르게 한 번 더 알려주세요. 찾을 옷 종류와 가장 중요한 조건을 한 문장으로 말씀해주세요.';
}
