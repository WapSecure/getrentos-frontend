import { contactRequestBody } from '@sureground/shared';
import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { LandPurchaseDetail, LandMilestone } from '@/types/landBuyer';
import type {
  CoApprovalView,
  DepositReleaseApproval,
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

/** A plot purchase (land only) or any sale transaction: a land resale or a built home. */
export type LandDealRef = { purchaseId: string } | { transactionId: string };

const dealPath = (deal: LandDealRef) =>
  'purchaseId' in deal
    ? `purchases/${encodeURIComponent(deal.purchaseId)}`
    : `transactions/${encodeURIComponent(deal.transactionId)}`;

// Sale transactions use the neutral routes, which work wherever land is switched off; plot purchases stay under land.
const buyerDeal = (deal: LandDealRef) =>
  'purchaseId' in deal ? `/buyer/land/${dealPath(deal)}` : `/buyer/${dealPath(deal)}`;
const representingDeal = (deal: LandDealRef) =>
  'purchaseId' in deal ? `/land/representing/${dealPath(deal)}` : `/representing/${dealPath(deal)}`;

export const representativeKeys = {
  mine: ['representatives', 'mine'] as const,
  representing: ['representatives', 'representing'] as const,
  coApproval: (deal: LandDealRef) => ['representatives', 'co-approval', dealPath(deal)] as const,
  deals: (principalId: string) => ['representatives', 'deals', principalId] as const,
  purchase: (purchaseId: string) => ['representatives', 'purchase', purchaseId] as const,
  resale: (txId: string) => ['representatives', 'resale', txId] as const,
};

export const representativeService = {
  mine: () => safeCall(() => authFetch<LandRepresentativeAppointment[]>('/buyer/representatives')),

  /** `contact` is their phone number or email; see `contactRequestBody`. */
  appoint: (input: {
    contact: string;
    relationship: RepresentativeRelationship;
    scopes: RepresentativeScope[];
    note?: string;
  }) =>
    safeCall(() =>
      post<LandRepresentativeAppointment[]>('/buyer/representatives', {
        ...(contactRequestBody(input.contact) ?? { contact: input.contact.trim() }),
        relationship: input.relationship,
        scopes: input.scopes,
        ...(input.note?.trim() ? { note: input.note.trim() } : {}),
      })
    ),

  revoke: (appointmentId: string, reason: string) =>
    safeCall(() =>
      post<LandRepresentativeAppointment[]>(
        `/buyer/representatives/${encodeURIComponent(appointmentId)}/revoke`,
        { reason: reason.trim() }
      )
    ),

  coApproval: (deal: LandDealRef) =>
    safeCall(() => authFetch<CoApprovalView>(`${buyerDeal(deal)}/co-approval`)),

  enableCoApproval: (deal: LandDealRef, representativeId: string) =>
    safeCall(() => post<CoApprovalView>(`${buyerDeal(deal)}/co-approval`, { representativeId })),

  disableCoApproval: (deal: LandDealRef) =>
    safeCall(() => post<CoApprovalView>(`${buyerDeal(deal)}/co-approval/disable`)),

  keepCoApproval: (deal: LandDealRef) =>
    safeCall(() => post<CoApprovalView>(`${buyerDeal(deal)}/co-approval/keep`)),

  representing: () => safeCall(() => authFetch<LandRepresentativeAppointment[]>('/representing')),

  respond: (appointmentId: string, response: 'ACCEPT' | 'DECLINE') =>
    safeCall(() =>
      post<LandRepresentativeAppointment[]>(
        `/representing/${encodeURIComponent(appointmentId)}/respond`,
        { response }
      )
    ),

  resign: (appointmentId: string, reason: string) =>
    safeCall(() =>
      post<LandRepresentativeAppointment[]>(
        `/representing/${encodeURIComponent(appointmentId)}/resign`,
        { reason: reason.trim() }
      )
    ),

  deals: (principalId: string) =>
    safeCall(() =>
      authFetch<PrincipalDeals>(`/representing/principals/${encodeURIComponent(principalId)}/deals`)
    ),

  purchase: (purchaseId: string) =>
    safeCall(() =>
      authFetch<LandPurchaseDetail>(
        `/land/representing/purchases/${encodeURIComponent(purchaseId)}`
      )
    ),

  resale: (txId: string) =>
    safeCall(() =>
      authFetch<LandMilestone[]>(
        `/representing/transactions/${encodeURIComponent(txId)}/milestones`
      )
    ),

  representativeCoApproval: (deal: LandDealRef) =>
    safeCall(() => authFetch<CoApprovalView>(`${representingDeal(deal)}/co-approval`)),

  approveStep: (deal: LandDealRef, key: string) =>
    safeCall(() =>
      post<unknown>(`${representingDeal(deal)}/milestones/${encodeURIComponent(key)}/approve`)
    ),

  /** My second approval to releasing a built home's held deposit. It never moves money: the buyer's release does, once both have approved. */
  approveDepositRelease: (txId: string) =>
    safeCall(() =>
      post<DepositReleaseApproval>(
        `/representing/transactions/${encodeURIComponent(txId)}/deposit-release/approve`
      )
    ),
};
