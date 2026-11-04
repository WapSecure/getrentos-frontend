'use client';

import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { estateService } from '@/services/estateService';

const STARTERS = [
  'How many households owe dues?',
  'Are there any critical incidents?',
  'Which maintenance tickets are urgent?',
  'How many visitors are on site?',
];

/** Ask GetRentos for estate managers, about the estate selected in the switcher. */
export const EstateAssistant = () => {
  const { estate } = useSelectedEstate();
  if (!estate) return null;
  return (
    <AssistantChat
      // Remount on switching estate, so one estate's conversation never carries into another's.
      key={estate.id}
      ask={(question, history) => unwrap(estateService.askAssistant(estate.id, question, history))}
      starters={STARTERS}
      scope={`Questions about ${estate.name}: households, dues, incidents, maintenance, violations, visitors and deliveries.`}
      placeholder="Ask about dues, incidents or visitors"
    />
  );
};
