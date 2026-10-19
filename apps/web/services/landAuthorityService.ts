import { authFetch, safeCall } from '@/lib/apiHelpers';
import type {
  LandAuthorityEmptyView,
  LandAuthorityInstrument,
  LandAuthorityView,
  LandConsentRequest,
  LandSellerCapacity,
  LandSignatoryRole,
} from '@getrentos/shared';

export interface DeclareLandAuthorityInput {
  capacity: LandSellerCapacity;
  principalName?: string;
  instrumentDocumentId?: string;
  instrumentType?: LandAuthorityInstrument;
  /** ISO date the instrument stops being good. */
  expiresAt?: string;
}

export interface AddLandSignatoryInput {
  role: LandSignatoryRole;
  fullName: string;
  phone?: string;
  /** Their GetRentos email, so they can answer from their own account. */
  email?: string;
}

const base = (propertyId: string) => `/owner/land/${encodeURIComponent(propertyId)}/authority`;
const send = <T>(path: string, method: string, body?: unknown) =>
  safeCall(() =>
    authFetch<T>(path, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  );

/**
 * The seller's authority to sell a land parcel (owner side), and a signatory's
 * consent requests (any signed-in account).
 */
export const landAuthorityService = {
  get: (propertyId: string) =>
    safeCall(() => authFetch<LandAuthorityView | LandAuthorityEmptyView>(base(propertyId))),
  declare: (propertyId: string, input: DeclareLandAuthorityInput) =>
    send<LandAuthorityView>(base(propertyId), 'PUT', input),
  addSignatory: (propertyId: string, input: AddLandSignatoryInput) =>
    send<LandAuthorityView>(`${base(propertyId)}/signatories`, 'POST', input),
  removeSignatory: (propertyId: string, signatoryId: string) =>
    send<LandAuthorityView>(
      `${base(propertyId)}/signatories/${encodeURIComponent(signatoryId)}`,
      'DELETE'
    ),
  recordConsent: (
    propertyId: string,
    signatoryId: string,
    input: { evidenceDocumentId: string; witnessName?: string }
  ) =>
    send<LandAuthorityView>(
      `${base(propertyId)}/signatories/${encodeURIComponent(signatoryId)}/consent`,
      'POST',
      input
    ),
  submit: (propertyId: string) => send<LandAuthorityView>(`${base(propertyId)}/submit`, 'POST'),
  appeal: (propertyId: string, note: string) =>
    send<LandAuthorityView>(`${base(propertyId)}/appeal`, 'POST', { note }),
  withdraw: (propertyId: string) =>
    send<{ withdrawn: boolean }>(`${base(propertyId)}/withdraw`, 'POST'),

  myConsentRequests: () =>
    safeCall(() => authFetch<LandConsentRequest[]>('/land/authority-requests')),
  respond: (signatoryId: string, decision: 'CONSENT' | 'OBJECT', reason?: string) =>
    send<{ signatoryId: string; consent: string }>(
      `/land/authority-requests/${encodeURIComponent(signatoryId)}`,
      'POST',
      { decision, ...(reason?.trim() ? { reason: reason.trim() } : {}) }
    ),
};
