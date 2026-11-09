'use client';

import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { buyerService } from '@/services/buyerService';

const STARTERS = [
  'Which offers need my answer?',
  'Where are my purchases up to?',
  'Do I have a deposit to pay?',
  'When is my next viewing?',
];

export const BuyerAssistant = () => (
  <AssistantChat
    ask={(question, history, language) =>
      unwrap(buyerService.askAssistant(question, history, language))
    }
    starters={STARTERS}
    scope="Questions about your offers, purchases, viewings, saved homes and documents."
    placeholder="Ask about offers, purchases or viewings"
  />
);
