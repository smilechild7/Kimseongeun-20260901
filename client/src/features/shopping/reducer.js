export const INITIAL_SHOPPING_STATE = Object.freeze({
  messages: [],
  status: 'idle',
  previousResponseId: null,
  error: null,
});

export function createInitialShoppingState(previousResponseId = null) {
  return { ...INITIAL_SHOPPING_STATE, previousResponseId };
}

export function shoppingReducer(state, action) {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return {
        ...state,
        status: 'loading',
        error: null,
        messages: [
          ...state.messages,
          { role: 'user', content: action.payload.displayMessage },
        ],
      };
    case 'RECEIVE_CLARIFICATION':
    case 'RECEIVE_RECOMMENDATION':
    case 'RECEIVE_NO_RESULT':
      return {
        ...state,
        status: 'ready',
        previousResponseId: action.payload.responseId,
        error: null,
        messages: [
          ...state.messages,
          { role: 'assistant', kind: action.payload.type, data: action.payload },
        ],
      };
    case 'RECEIVE_RECOVERY_CLARIFICATION':
      return {
        ...state,
        status: 'ready',
        error: null,
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            kind: 'clarification',
            data: {
              type: 'clarification',
              message: action.payload.message,
              recovery: true,
            },
          },
        ],
      };
    case 'REQUEST_FAILED':
      return { ...state, status: 'error', error: action.payload };
    case 'RESET_CONVERSATION':
      return createInitialShoppingState();
    default:
      return state;
  }
}
