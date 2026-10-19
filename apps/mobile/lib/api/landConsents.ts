import type { LandConsentRequest } from '@getrentos/shared';
import { apiFetch } from './client';

/**
 * Land sales whose seller named you as someone whose consent the sale needs
 * (a co-owner, family member, principal). Objecting pauses the sale until
 * GetRentos resolves it.
 */
export const MIN_OBJECTION = 5;

export const landConsentsApi = {
  mine: () => apiFetch<LandConsentRequest[]>('/land/authority-requests'),
  respond: (signatoryId: string, decision: 'CONSENT' | 'OBJECT', reason?: string) =>
    apiFetch<{ signatoryId: string; consent: string }>(
      `/land/authority-requests/${encodeURIComponent(signatoryId)}`,
      { method: 'POST', body: { decision, ...(reason?.trim() ? { reason: reason.trim() } : {}) } }
    ),
};
