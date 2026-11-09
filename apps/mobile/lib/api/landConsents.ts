import type { LandConsentRequest } from '@sureground/shared';
import { apiFetch } from './client';

export const MIN_OBJECTION = 5;

export const landConsentsApi = {
  mine: () => apiFetch<LandConsentRequest[]>('/land/authority-requests'),
  respond: (signatoryId: string, decision: 'CONSENT' | 'OBJECT', reason?: string) =>
    apiFetch<{ signatoryId: string; consent: string }>(
      `/land/authority-requests/${encodeURIComponent(signatoryId)}`,
      { method: 'POST', body: { decision, ...(reason?.trim() ? { reason: reason.trim() } : {}) } }
    ),
};
