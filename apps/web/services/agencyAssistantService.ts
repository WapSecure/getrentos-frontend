import type { ReplyLanguage } from '@/lib/replyLanguage';
import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { AssistantReply, AssistantTurn } from '@/types/assistant';

export const agencyAssistantService = {
  /** Read-only answers about the caller's firm's managed book. */
  ask: (question: string, history: AssistantTurn[], language?: ReplyLanguage) =>
    safeCall<AssistantReply>(() =>
      authFetch('/agency/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({ question, history, language }),
      })
    ),
};
