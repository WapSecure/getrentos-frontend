import type {
  LandAuthorityEmptyView,
  LandAuthorityInstrument,
  LandAuthorityView,
  LandSellerCapacity,
  LandSignatoryRole,
} from '@sureground/shared';
import { apiFetch } from './client';

/**
 * The seller's authority to sell a land parcel: the capacity they sell in, the
 * instrument it rests on, and whose consent it needs. Land review cannot be
 * approved until Sureground has verified it. Types and wording come from
 * @sureground/shared so web and mobile read a claim the same way.
 */

export interface DeclareAuthorityInput {
  capacity: LandSellerCapacity;
  principalName?: string;
  instrumentDocumentId?: string;
  instrumentType?: LandAuthorityInstrument;
  /** `yyyy-MM-dd`, when the instrument stops being good. */
  expiresAt?: string;
}

export interface AddSignatoryInput {
  role: LandSignatoryRole;
  fullName: string;
  phone?: string;
  /** Their Sureground email, so they can answer from their own account. */
  email?: string;
}

export const isClaim = (view: unknown): view is LandAuthorityView =>
  !!view && typeof view === 'object' && !!(view as LandAuthorityView).authority;

/** Claims a seller can still change: not under objection, not rejected or revoked. */
export const isEditable = (status: string) =>
  status === 'DRAFT' || status === 'PENDING_REVIEW' || status === 'VERIFIED';

/** Why the declaration can't be saved yet, or null. */
export function declareBlocker(input: {
  capacity: string;
  principalRequired: boolean;
  principalName: string;
}): string | null {
  if (!input.capacity) return 'Choose how you hold or represent this land.';
  if (input.principalRequired && !input.principalName.trim()) {
    return 'Name whose authority you exercise.';
  }
  return null;
}

const base = (propertyId: string) => `/owner/land/${encodeURIComponent(propertyId)}/authority`;

export const landAuthorityApi = {
  get: (propertyId: string) =>
    apiFetch<LandAuthorityView | LandAuthorityEmptyView>(base(propertyId)),
  declare: (propertyId: string, input: DeclareAuthorityInput) =>
    apiFetch<LandAuthorityView>(base(propertyId), { method: 'PUT', body: input }),
  addSignatory: (propertyId: string, input: AddSignatoryInput) =>
    apiFetch<LandAuthorityView>(`${base(propertyId)}/signatories`, { method: 'POST', body: input }),
  removeSignatory: (propertyId: string, signatoryId: string) =>
    apiFetch<LandAuthorityView>(
      `${base(propertyId)}/signatories/${encodeURIComponent(signatoryId)}`,
      { method: 'DELETE' }
    ),
  recordConsent: (
    propertyId: string,
    signatoryId: string,
    input: { evidenceDocumentId: string; witnessName?: string }
  ) =>
    apiFetch<LandAuthorityView>(
      `${base(propertyId)}/signatories/${encodeURIComponent(signatoryId)}/consent`,
      { method: 'POST', body: input }
    ),
  submit: (propertyId: string) =>
    apiFetch<LandAuthorityView>(`${base(propertyId)}/submit`, { method: 'POST' }),
  appeal: (propertyId: string, note: string) =>
    apiFetch<LandAuthorityView>(`${base(propertyId)}/appeal`, { method: 'POST', body: { note } }),
  withdraw: (propertyId: string) =>
    apiFetch<{ withdrawn: boolean }>(`${base(propertyId)}/withdraw`, { method: 'POST' }),
};
