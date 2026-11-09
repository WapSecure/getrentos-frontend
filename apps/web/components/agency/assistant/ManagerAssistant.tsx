'use client';

import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { agencyAssistantService } from '@/services/agencyAssistantService';

const STARTERS = [
  'How much rent have we collected this month?',
  'How much is in arrears?',
  'Which owner queries are waiting on me?',
  'Any work orders past their deadline?',
];

/** Ask Sureground for property managers: the firm's owners, occupancy, rent, arrears, maintenance and queries. */
export const ManagerAssistant = () => (
  <AssistantChat
    ask={(question, history, language) =>
      unwrap(agencyAssistantService.ask(question, history, language))
    }
    starters={STARTERS}
    scope="Questions about your firm's owners, occupancy, rent collection, arrears, maintenance and owner queries."
    placeholder="Ask about rent, arrears or owner queries"
  />
);
