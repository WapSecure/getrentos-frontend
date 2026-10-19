import { authFetch, safeCall } from '@getrentos/shared';
import type { ApiResponse, LandAuthorityStatus, LandAuthorityView } from '@getrentos/shared';

const base = (authorityId: string) => `/admin/land/authority/${encodeURIComponent(authorityId)}`;
const post = (path: string, body?: object): Promise<ApiResponse<LandAuthorityView>> =>
  safeCall(() =>
    authFetch<LandAuthorityView>(path, {
      method: 'POST',
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  );

/**
 * Sellers' claims of authority to sell land. Reading and checking evidence
 * needs `verifications.review`; decisions, waivers and resolving objections
 * need `verifications.approve`.
 */
export const adminLandAuthorityService = {
  /** Under review and disputed claims by default, oldest first. */
  queue: (status?: LandAuthorityStatus): Promise<ApiResponse<LandAuthorityView[]>> =>
    safeCall(() =>
      authFetch(`/admin/land/authority${status ? `?status=${encodeURIComponent(status)}` : ''}`)
    ),
  detail: (authorityId: string): Promise<ApiResponse<LandAuthorityView>> =>
    safeCall(() => authFetch(base(authorityId))),
  verifySignatory: (authorityId: string, signatoryId: string) =>
    post(`${base(authorityId)}/signatories/${encodeURIComponent(signatoryId)}/verify`),
  waiveSignatory: (authorityId: string, signatoryId: string, note: string) =>
    post(`${base(authorityId)}/signatories/${encodeURIComponent(signatoryId)}/waive`, { note }),
  recordLegalInquiry: (authorityId: string, note: string, documentId?: string) =>
    post(`${base(authorityId)}/legal-inquiry`, { note, ...(documentId ? { documentId } : {}) }),
  recordObjection: (
    authorityId: string,
    input: { fullName: string; phone?: string; reason: string; evidenceDocumentId?: string }
  ) => post(`${base(authorityId)}/objections`, input),
  resolveObjection: (
    authorityId: string,
    signatoryId: string,
    outcome: 'UPHELD' | 'DISMISSED',
    note: string
  ) =>
    post(`${base(authorityId)}/objections/${encodeURIComponent(signatoryId)}/resolve`, {
      outcome,
      note,
    }),
  decide: (authorityId: string, decision: 'VERIFY' | 'REJECT', note?: string) =>
    post(`${base(authorityId)}/decision`, {
      decision,
      ...(note?.trim() ? { note: note.trim() } : {}),
    }),
  revoke: (authorityId: string, note: string) => post(`${base(authorityId)}/revoke`, { note }),
};
