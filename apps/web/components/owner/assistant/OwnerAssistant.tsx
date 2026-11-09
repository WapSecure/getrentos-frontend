'use client';

import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { ownerService } from '@/services/ownerService';

const STARTERS = [
  'Which offers need an answer?',
  'Where are my sales up to?',
  'Do I have viewings to confirm?',
  'Has a realtor asked to work with me?',
];

/** Ask Sureground for property owners: properties, listings, offers, sales, viewings and realtors. */
export const OwnerAssistant = () => (
  <AssistantChat
    ask={(question, history, language) =>
      unwrap(ownerService.askAssistant(question, history, language))
    }
    starters={STARTERS}
    scope="Questions about your properties, listings, offers, sales, viewings and realtors."
    placeholder="Ask about offers, sales or viewings"
  />
);
