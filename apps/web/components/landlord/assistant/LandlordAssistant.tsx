'use client';

import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { landlordService } from '@/services/landlordService';

const STARTERS = [
  'Who owes me rent?',
  'Which leases end in the next 60 days?',
  'Do I have urgent repairs?',
  'How many units are vacant?',
];

/** Ask GetRentos for landlords: arrears, leases, repairs, applications and occupancy. */
export const LandlordAssistant = () => (
  <AssistantChat
    ask={(question, history, language) =>
      unwrap(landlordService.askAssistant(question, history, language))
    }
    starters={STARTERS}
    scope="Questions about your rent and arrears, leases, repairs, applications, viewings and occupancy."
    placeholder="Ask about rent, leases or repairs"
  />
);
