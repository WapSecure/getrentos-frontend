'use client';

import { AssistantChat } from '@/components/shared/assistant/AssistantChat';
import { unwrap } from '@/lib/apiHelpers';
import { agentService } from '@/services/agentService';

const STARTERS = [
  'What should I do first today?',
  'Which inspections are still drafts?',
  'Do I have work orders to start?',
  'Has a client approved my invitation?',
];

/** Ask Sureground for field agents: tasks, inspections, verifications, work orders and clients. */
export const AgentAssistant = () => (
  <AssistantChat
    ask={(question, history, language) =>
      unwrap(agentService.askAssistant(question, history, language))
    }
    starters={STARTERS}
    scope="Questions about your tasks, inspections, verifications, work orders and clients."
    placeholder="Ask about tasks, inspections or work orders"
  />
);
