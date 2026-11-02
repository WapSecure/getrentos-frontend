import { apiFetch } from './client';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantLink {
  label: string;
  path: string;
}

export interface RenterAssistantReply {
  answer: string;
  links: AssistantLink[];
  suggestions: string[];
  source: 'ai' | 'heuristic';
  model: string | null;
}

export const assistantApi = {
  ask: (question: string, history: AssistantTurn[]) =>
    apiFetch<RenterAssistantReply>('/renter/assistant/ask', {
      method: 'POST',
      body: { question, history },
    }),
};

/** The server links to web screens; these are the matching app screens. */
const MOBILE_ROUTES: Record<string, string> = {
  '/renter/home': '/(app)/(renter)',
  '/renter/home?tab=lease': '/(app)/lease',
  '/renter/home?tab=deposit': '/(app)/lease',
  '/renter/payments': '/(app)/payments',
  '/renter/applications': '/(app)/(renter)/applications',
  '/renter/viewings': '/(app)/viewings',
  '/renter/maintenance': '/(app)/renter-maintenance',
  '/renter/messages': '/(app)/(renter)/messages',
  '/renter/discover': '/(app)/(renter)/discover',
  '/renter/saved': '/(app)/saved',
  '/renter/roommates': '/(app)/roommates',
  '/renter/trust-score': '/(app)/trust-score',
  '/renter/settings': '/(app)/(renter)/account',
  '/renter/help': '/(app)/help',
  '/renter/support': '/(app)/support',
};

export function mobileRouteFor(path: string): string | null {
  return MOBILE_ROUTES[path] ?? null;
}
