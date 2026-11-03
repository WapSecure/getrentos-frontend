'use client';

import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { renterService } from '@/services/renterService';

const STARTERS = [
  'When is my next rent due?',
  'When does my lease end?',
  'Where is my application?',
  'How does payment protection work?',
];

/** Ask GetRentos for renters: rent, lease, applications, viewings and repairs. */
export const RenterAssistant = () => (
  <AssistantChat
    ask={(question, history) => unwrap(renterService.askAssistant(question, history))}
    starters={STARTERS}
    scope="Questions about your rent, lease, applications, viewings and repairs."
    placeholder="Ask about your rent, lease or repairs"
  />
);
