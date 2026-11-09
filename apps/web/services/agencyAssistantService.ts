import type { ReplyLanguage } from '@/lib/replyLanguage';
import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { AssistantReply, AssistantTurn } from '@/types/assistant';

export const agencyAssistantService = {
  ask: (question: string, history: AssistantTurn[], language?: ReplyLanguage) =>
    safeCall<AssistantReply>(() =>
      authFetch('/agency/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({ question, history, language }),
      })
    ),
};
