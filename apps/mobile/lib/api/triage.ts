import { apiFetch } from './client';

/** Server enums are upper-case. */
export interface MaintenanceTriage {
  requestId: string;
  reviewId?: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  needsVendor: boolean;
  rationale: string;
  draftWorkOrder: string;
  suggestedVendor: { id: string; name: string } | null;
  source: 'ai' | 'heuristic';
}

export type TriageDecision =
  | { decision: 'accept'; draftWorkOrder?: string }
  | { decision: 'reject'; reason: string };

/** The server checks the caller's authority each time. */
export const triageApi = {
  triage: (requestId: string) =>
    apiFetch<MaintenanceTriage>(`/ai/maintenance/${requestId}/triage`, { method: 'POST' }),
  decide: (requestId: string, reviewId: string, decision: TriageDecision) =>
    apiFetch<{ reviewId: string; outcome: 'ACCEPTED' | 'EDITED' | 'REJECTED' }>(
      `/ai/maintenance/${requestId}/triage/decision`,
      { method: 'POST', body: { reviewId, ...decision } }
    ),
};
