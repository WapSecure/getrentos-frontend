import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { LandDispute, LandDisputeKind } from '@/types/landDispute';

const base = '/land/disputes';
const json = (path: string, body: unknown) =>
  safeCall(() => authFetch<LandDispute>(path, { method: 'POST', body: JSON.stringify(body) }));

/** Land disputes for the people involved: reporter, owner, buyer. */
export const landDisputeService = {
  open: (input: {
    propertyId: string;
    purchaseId?: string;
    kind: LandDisputeKind;
    description: string;
  }) => json(base, input),
  mine: () => safeCall(() => authFetch<LandDispute[]>(base)),
  get: (disputeId: string) =>
    safeCall(() => authFetch<LandDispute>(`${base}/${encodeURIComponent(disputeId)}`)),
  appeal: (disputeId: string, reason: string) =>
    json(`${base}/${encodeURIComponent(disputeId)}/appeal`, { reason }),
  /** Multipart: the browser sets the boundary. Evidence is kept permanently. */
  addEvidence: (disputeId: string, file: File, note?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (note?.trim()) form.append('note', note.trim());
    return safeCall(() =>
      authFetch<LandDispute>(`${base}/${encodeURIComponent(disputeId)}/evidence`, {
        method: 'POST',
        body: form,
      })
    );
  },
};

export const landDisputeKeys = {
  all: ['land', 'disputes'] as const,
  mine: ['land', 'disputes', 'mine'] as const,
  detail: (disputeId: string) => ['land', 'disputes', 'detail', disputeId] as const,
};
