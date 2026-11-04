'use client';

import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentService } from '@/services/estateResidentService';

const STARTERS = [
  'Do I owe any dues?',
  'Is anyone waiting at the gate for me?',
  'Any parcels for me?',
  'Any new announcements?',
];

/** Ask GetRentos for estate residents: their own dues, visitors, deliveries, repairs and estate news. */
export const ResidentAssistant = () => (
  <AssistantChat
    ask={(question, history) => unwrap(estateResidentService.askAssistant(question, history))}
    starters={STARTERS}
    scope="Questions about your household: dues, visitors, deliveries, repairs, announcements, polls and bookings."
    placeholder="Ask about dues, visitors or deliveries"
  />
);
