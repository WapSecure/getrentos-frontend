import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { LandPurchaseDetail, LandMilestone } from '@/types/landBuyer';
import type {
  CoApprovalView,
  LandRepresentativeAppointment,
  PrincipalDeals,
  RepresentativeRelationship,
  RepresentativeScope,
} from '@/types/landRepresentative';

const post = <T>(path: string, body?: unknown) =>
  authFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

/** A plot purchase or a land resale, as the co-approval routes address them. */
export type LandDealRef = { purchaseId: string } | { transactionId: string };

const dealPath = (deal: LandDealRef) =>
  'purchaseId' in deal
    ? `purchases/${encodeURIComponent(deal.purchaseId)}`
    : `transactions/${encodeURIComponent(deal.transactionId)}`;

export const landRepresentativeKeys = {
  mine: ['land', 'representatives', 'mine'] as const,
  representing: ['land', 'representatives', 'representing'] as const,
  coApproval: (deal: LandDealRef) =>
    ['land', 'representatives', 'co-approval', dealPath(deal)] as const,
  deals: (principalId: string) => ['land', 'representatives', 'deals', principalId] as const,
  purchase: (purchaseId: string) => ['land', 'representatives', 'purchase', purchaseId] as const,
  resale: (txId: string) => ['land', 'representatives', 'resale', txId] as const,
};

/** Diaspora mode: the buyer's representatives, and the representative's own desk. */
export const landRepresentativeService = {
  // ─── The buyer ─────────────────────────────────────────────────────────────
  mine: () =>
    safeCall(() => authFetch<LandRepresentativeAppointment[]>('/buyer/land/representatives')),

  appoint: (input: {
    email: string;
    relationship: RepresentativeRelationship;
    scopes: RepresentativeScope[];
    note?: string;
  }) =>
    safeCall(() =>
      post<LandRepresentativeAppointment[]>('/buyer/land/representatives', {
        email: input.email.trim(),
        relationship: input.relationship,
        scopes: input.scopes,
        ...(input.note?.trim() ? { note: input.note.trim() } : {}),
      })
    ),

  revoke: (appointmentId: string, reason: string) =>
    safeCall(() =>
      post<LandRepresentativeAppointment[]>(
        `/buyer/land/representatives/${encodeURIComponent(appointmentId)}/revoke`,
        { reason: reason.trim() }
      )
    ),

  coApproval: (deal: LandDealRef) =>
    safeCall(() => authFetch<CoApprovalView>(`/buyer/land/${dealPath(deal)}/co-approval`)),

  enableCoApproval: (deal: LandDealRef, representativeId: string) =>
    safeCall(() =>
      post<CoApprovalView>(`/buyer/land/${dealPath(deal)}/co-approval`, { representativeId })
    ),

  disableCoApproval: (deal: LandDealRef) =>
    safeCall(() => post<CoApprovalView>(`/buyer/land/${dealPath(deal)}/co-approval/disable`)),

  keepCoApproval: (deal: LandDealRef) =>
    safeCall(() => post<CoApprovalView>(`/buyer/land/${dealPath(deal)}/co-approval/keep`)),

  // ─── The representative ────────────────────────────────────────────────────
  representing: () =>
    safeCall(() => authFetch<LandRepresentativeAppointment[]>('/land/representing')),

  respond: (appointmentId: string, response: 'ACCEPT' | 'DECLINE') =>
    safeCall(() =>
      post<LandRepresentativeAppointment[]>(
        `/land/representing/${encodeURIComponent(appointmentId)}/respond`,
        { response }
      )
    ),

  resign: (appointmentId: string, reason: string) =>
    safeCall(() =>
      post<LandRepresentativeAppointment[]>(
        `/land/representing/${encodeURIComponent(appointmentId)}/resign`,
        { reason: reason.trim() }
      )
    ),

  deals: (principalId: string) =>
    safeCall(() =>
      authFetch<PrincipalDeals>(
        `/land/representing/principals/${encodeURIComponent(principalId)}/deals`
      )
    ),

  purchase: (purchaseId: string) =>
    safeCall(() =>
      authFetch<LandPurchaseDetail>(
        `/land/representing/purchases/${encodeURIComponent(purchaseId)}`
      )
    ),

  resale: (txId: string) =>
    safeCall(() =>
      authFetch<LandMilestone[]>(`/land/representing/transactions/${encodeURIComponent(txId)}`)
    ),

  representativeCoApproval: (deal: LandDealRef) =>
    safeCall(() => authFetch<CoApprovalView>(`/land/representing/${dealPath(deal)}/co-approval`)),

  approveStep: (deal: LandDealRef, key: string) =>
    safeCall(() =>
      post<unknown>(
        `/land/representing/${dealPath(deal)}/milestones/${encodeURIComponent(key)}/approve`
      )
    ),
};
