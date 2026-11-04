'use client';

import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';

const STARTERS = [
  'Which offers need an answer?',
  'What commission can I withdraw?',
  'Do I have viewings coming up?',
  'How many open leads do I have?',
];

/** Ask GetRentos for realtors: listings, offers, leads, viewings, clients and commissions. */
export const RealtorAssistant = () => (
  <AssistantChat
    ask={(question, history) => unwrap(realtorService.askAssistant(question, history))}
    starters={STARTERS}
    scope="Questions about your listings, offers, leads, viewings, clients and commissions."
    placeholder="Ask about offers, leads or commissions"
  />
);
