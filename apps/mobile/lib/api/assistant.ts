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

export type AssistantPersona = 'renter' | 'landlord';

export const assistantApi = {
  ask: (question: string, history: AssistantTurn[], persona: AssistantPersona = 'renter') =>
    apiFetch<RenterAssistantReply>(`/${persona}/assistant/ask`, {
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
  '/landlord/dashboard': '/(app)/(landlord)',
  '/landlord/properties': '/(app)/(landlord)/properties',
  '/landlord/units': '/(app)/(landlord)/properties',
  '/landlord/tenants': '/(app)/(landlord)/tenants',
  '/landlord/leases': '/(app)/landlord-leases',
  '/landlord/payments': '/(app)/landlord-payments',
  '/landlord/arrears': '/(app)/landlord-payments',
  '/landlord/financials': '/(app)/landlord-financials',
  '/landlord/maintenance': '/(app)/landlord-maintenance',
  '/landlord/vendors': '/(app)/landlord-vendors',
  '/landlord/applications': '/(app)/landlord-applications',
  '/landlord/viewing-requests': '/(app)/landlord-viewings',
  '/landlord/messages': '/(app)/(landlord)/messages',
  '/landlord/settings': '/(app)/landlord-settings',
  '/landlord/help': '/(app)/help',
};

export function mobileRouteFor(path: string): string | null {
  return MOBILE_ROUTES[path] ?? null;
}
