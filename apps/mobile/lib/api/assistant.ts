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

export type AssistantPersona = 'renter' | 'landlord' | 'realtor' | 'owner' | 'buyer' | 'agent';

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
  '/realtor/dashboard': '/(app)/(realtor)',
  '/realtor/listings': '/(app)/(realtor)/listings',
  '/realtor/offers': '/(app)/realtor-offers',
  '/realtor/leads': '/(app)/(realtor)/pipeline',
  '/realtor/viewings': '/(app)/(realtor)/pipeline?tab=viewings',
  '/realtor/clients': '/(app)/realtor-clients',
  '/realtor/commissions': '/(app)/realtor-commissions',
  '/realtor/messages': '/(app)/(realtor)/messages',
  '/realtor/documents': '/(app)/realtor-documents',
  '/realtor/reviews': '/(app)/realtor-reviews',
  '/realtor/verification': '/(app)/realtor-trust-profile',
  '/realtor/settings': '/(app)/(realtor)/account',
  '/realtor/help': '/(app)/help',
  '/owner/dashboard': '/(app)/(owner)',
  '/owner/properties': '/(app)/(owner)/properties',
  '/owner/listings': '/(app)/(owner)/properties',
  '/owner/offers': '/(app)/(owner)/offers',
  '/owner/transactions': '/(app)/owner-transactions',
  '/owner/viewings': '/(app)/owner-viewings',
  '/owner/realtors': '/(app)/representatives',
  '/owner/messages': '/(app)/(owner)/messages',
  '/owner/documents': '/(app)/owner-documents',
  '/owner/verification': '/(app)/owner-trust-profile',
  '/owner/settings': '/(app)/owner-settings',
  '/owner/help': '/(app)/help',
  '/buyer/dashboard': '/(app)/(buyer)',
  '/buyer/discover': '/(app)/(buyer)/discover',
  '/buyer/saved': '/(app)/buyer-saved',
  '/buyer/offers': '/(app)/(buyer)/offers',
  '/buyer/transactions': '/(app)/buyer-transactions',
  '/buyer/viewings': '/(app)/buyer-viewings',
  '/buyer/messages': '/(app)/(buyer)/messages',
  '/buyer/documents': '/(app)/buyer-documents',
  '/buyer/verification': '/(app)/buyer-trust-profile',
  '/buyer/settings': '/(app)/(buyer)/account',
  '/buyer/help': '/(app)/help',
  '/agent/dashboard': '/(app)/(agent)',
  '/agent/tasks': '/(app)/(agent)/tasks',
  '/agent/inspections': '/(app)/agent-inspections',
  '/agent/verifications': '/(app)/agent-verifications',
  '/agent/work-orders': '/(app)/agent-work-orders',
  '/agent/sync': '/(app)/agent-sync',
  '/agent/documents': '/(app)/agent-documents',
  '/agent/messages': '/(app)/(agent)/messages',
  '/agent/trust-profile': '/(app)/agent-trust-profile',
  '/agent/verification': '/(app)/agent-trust-profile',
  '/agent/settings': '/(app)/(agent)/account',
  '/agent/help': '/(app)/help',
};

export function mobileRouteFor(path: string): string | null {
  return MOBILE_ROUTES[path] ?? null;
}
