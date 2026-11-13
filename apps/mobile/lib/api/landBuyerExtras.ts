import type { BadgeTone } from '@sureground/ui-native';
import type {
  CoApprovalPendingStep,
  DepositReleaseApprovalOutcome,
  SiteTourRecording,
  SiteTourStatus,
} from '@sureground/shared';
import { contactRequestBody } from '@sureground/shared';
import { apiFetch } from './client';
import type { BuyerPurchaseDetail } from './landBuyer';
import type { Milestone } from './landSales';
import type { TourJoin } from './ownerLand';

const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', ...(body !== undefined ? { body } : {}) });

export const LAND_TOUR_DISCLAIMER =
  'A video tour shows the land as it looks today. It is not a registry search, a survey or an inspection, and it does not confirm who owns the land or where its boundaries are.';

export type BuyerTourStatus = SiteTourStatus;

export const BUYER_TOUR_STATUS: Record<BuyerTourStatus, { label: string; tone: BadgeTone }> = {
  REQUESTED: { label: 'Waiting for times', tone: 'warning' },
  PROPOSED: { label: 'Times offered', tone: 'info' },
  SCHEDULED: { label: 'Booked', tone: 'success' },
  COMPLETED: { label: 'Done', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  HOST_NO_SHOW: { label: 'Host did not join', tone: 'danger' },
};

export interface BuyerTour {
  id: string;
  status: BuyerTourStatus;
  land: string;
  city: string;
  state: string;
  hostName: string;
  attendeeName?: string | null;
  scheduledAt?: string | null;
  scheduledLocal?: string | null;
  durationMinutes: number;
  meetingUrl?: string | null;
  preferredTimes?: string | null;
  hostNotes?: string | null;
  cancelReason?: string | null;
  proposedSlots: { at: string; local: string }[];
  buyerRating?: number | null;
  disclaimer?: string | null;
  createdAt?: string;
  videoCall?: 'BUILT_IN' | 'LINK' | null;
  recording?: SiteTourRecording;
}

/** Reasons for cancelling or asking for other times: 3–500 characters. */
export const tourReasonOk = (s: string) => s.trim().length >= 3 && s.trim().length <= 500;

/** The buyer can say the seller didn't join once a booked tour is 15 minutes old. */
export const canReportNoShow = (t: Pick<BuyerTour, 'status' | 'scheduledAt'>, now: number) =>
  t.status === 'SCHEDULED' && !!t.scheduledAt && now > Date.parse(t.scheduledAt) + 15 * 60_000;

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
  } catch {
    return 'Africa/Lagos';
  }
}

export const PRE_PURCHASE_DISCLAIMER =
  'An inspection records what the land looks like on the day. It is not a registry search or a survey, and it does not confirm who owns the land.';

export const INSPECTION_FOCUS = [
  { value: 'BEACONS', label: 'Find and photograph every boundary beacon' },
  { value: 'ACCESS', label: 'Show the access road and how the land is reached' },
  {
    value: 'OCCUPATION',
    label: 'Check whether anyone is living on, farming or building on the land',
  },
  {
    value: 'ENCROACHMENT',
    label: 'Look for fences, foundations or structures crossing the boundary',
  },
  { value: 'DRAINAGE', label: 'Note drainage, flooding signs and the state of the ground' },
  { value: 'NEIGHBOURS', label: 'Photograph the neighbouring plots and anything notable nearby' },
] as const;

export interface PrePurchaseInspection {
  id: string;
  reference: string;
  status: string;
  kind: string;
  dueBy?: string | null;
  land: string;
  city: string;
  state: string;
  plotId?: string | null;
  reinspectionOfId?: string | null;
  inspector?: { name: string } | null;
  report?: {
    boundaryCondition: 'INTACT' | 'DISTURBED' | 'ENCROACHED' | 'INCONCLUSIVE' | null;
    beaconsExpected?: number | null;
    beaconsFound?: number | null;
    summary?: string | null;
    submittedAt?: string | null;
    staffNote?: string | null;
    evidence?: { id: string; fileName: string; mimeType: string; url: string }[];
  } | null;
  questions?: {
    id: string;
    question: string;
    answer?: string | null;
    answeredAt?: string | null;
  }[];
  disclaimer?: string | null;
}

/** Questions about a report and reinspection reasons: 10–2000 characters. */
export const inspectionTextOk = (s: string) => s.trim().length >= 10 && s.trim().length <= 2000;

export type RepScope = 'VIEW' | 'CO_APPROVE' | 'ATTEND';
export const REP_SCOPES: { value: RepScope; label: string }[] = [
  { value: 'VIEW', label: 'See my land purchases, their steps and documents' },
  { value: 'CO_APPROVE', label: 'Give the second approval before money is released to a seller' },
  { value: 'ATTEND', label: 'Attend site visits and tours for me' },
];
export const REP_RELATIONSHIPS = [
  { value: 'FAMILY', label: 'Family' },
  { value: 'LAWYER', label: 'Lawyer' },
  { value: 'FRIEND', label: 'Friend' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const REP_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  INVITED: { label: 'Invited', tone: 'info' },
  ACTIVE: { label: 'Active', tone: 'success' },
  DECLINED: { label: 'Declined', tone: 'neutral' },
  REVOKED: { label: 'Ended', tone: 'neutral' },
};

export interface Appointment {
  id: string;
  principalId: string;
  relationship: string;
  scopes: RepScope[];
  status: 'INVITED' | 'ACTIVE' | 'DECLINED' | 'REVOKED';
  note?: string | null;
  name?: string | null;
  email?: string | null;
  /** e.g. "+234 803 *** 4567"; the other person's full number is never sent. */
  phoneMasked?: string | null;
  acceptedAt?: string | null;
  endedAt?: string | null;
  endedReason?: string | null;
}

export const emailOk = (s: string) => /\S+@\S+\.\S+/.test(s.trim());

export interface CoApproval {
  binding: boolean;
  status?: 'ACTIVE' | 'DISABLE_PENDING' | 'DISABLED';
  disableEffectiveAt?: string | null;
  representative?: { appointmentId: string; name: string } | null;
  pending?: CoApprovalPendingStep[];
  /** Both approved the deposit release; the buyer still has to press Release. */
  releaseApproved?: boolean;
}

/**
 * A plot purchase, a land resale under the land routes, or any sale (built home or land resale)
 * under the neutral routes, which work wherever land is switched off.
 */
export type Deal =
  | { kind: 'purchase'; id: string }
  | { kind: 'transaction'; id: string }
  | { kind: 'sale'; id: string };
const dealPath = (d: Deal) =>
  `${d.kind === 'purchase' ? 'purchases' : 'transactions'}/${encodeURIComponent(d.id)}`;
const buyerDeal = (d: Deal) =>
  d.kind === 'sale' ? `/buyer/${dealPath(d)}` : `/buyer/land/${dealPath(d)}`;
const representingDeal = (d: Deal) =>
  d.kind === 'sale' ? `/representing/${dealPath(d)}` : `/land/representing/${dealPath(d)}`;

export interface PrincipalDeals {
  purchases: {
    purchaseId: string;
    reference: string;
    status: string;
    title: string;
    youApprovePayments: boolean;
  }[];
  resales: {
    transactionId: string;
    escrowStatus: string;
    amount: number;
    title: string;
    youApprovePayments: boolean;
  }[];
}

export const landBuyerExtrasApi = {
  tours: () => apiFetch<BuyerTour[]>('/buyer/land/tours'),
  requestTour: (input: {
    listingId?: string;
    plotId?: string;
    timeZone: string;
    preferredTimes?: string;
    attendeeAppointmentId?: string;
  }) => post<BuyerTour>('/buyer/land/tours', { ...input, acknowledgedNotASearch: true }),
  chooseSlot: (id: string, slot: string) =>
    post<BuyerTour>(`/buyer/land/tours/${id}/choose`, { slot }),
  otherTimes: (id: string, reason: string) =>
    post<BuyerTour>(`/buyer/land/tours/${id}/other-times`, { reason: reason.trim() }),
  cancelTour: (id: string, reason: string) =>
    post<BuyerTour>(`/buyer/land/tours/${id}/cancel`, { reason: reason.trim() }),
  hostNoShow: (id: string) => post<BuyerTour>(`/buyer/land/tours/${id}/host-no-show`),
  tourRecordingConsent: (id: string, consent: boolean) =>
    post<BuyerTour>(`/buyer/land/tours/${encodeURIComponent(id)}/recording-consent`, { consent }),
  joinTour: (id: string) => post<TourJoin>(`/buyer/land/tours/${encodeURIComponent(id)}/join`),
  rateTour: (id: string, rating: number, comment?: string) =>
    post<BuyerTour>(`/buyer/land/tours/${id}/feedback`, {
      rating,
      ...(comment?.trim() ? { comment: comment.trim() } : {}),
    }),

  inspections: () => apiFetch<PrePurchaseInspection[]>('/buyer/land/inspections'),
  requestInspection: (input: {
    listingId?: string;
    plotId?: string;
    focus: string[];
    notes?: string;
  }) =>
    post<PrePurchaseInspection>('/buyer/land/inspections', {
      ...input,
      acknowledgedNotASearch: true,
    }),
  askAboutReport: (id: string, text: string) =>
    post<PrePurchaseInspection>(`/buyer/land/inspections/${id}/questions`, { text: text.trim() }),
  requestReinspection: (id: string, reason: string) =>
    post<PrePurchaseInspection>(`/buyer/land/inspections/${id}/reinspection`, {
      reason: reason.trim(),
    }),

  representatives: () => apiFetch<Appointment[]>('/buyer/land/representatives'),
  /** `contact` is their phone number or email: an email goes as `email` (older servers accept it), a phone as `contact`. */
  appoint: ({
    contact,
    ...rest
  }: {
    contact: string;
    relationship: string;
    scopes: RepScope[];
    note?: string;
  }) =>
    post<Appointment[]>('/buyer/land/representatives', {
      ...(contactRequestBody(contact) ?? { contact: contact.trim() }),
      ...rest,
    }),
  endAppointment: (id: string, reason: string) =>
    post<Appointment[]>(`/buyer/land/representatives/${id}/revoke`, { reason: reason.trim() }),

  coApproval: (d: Deal) => apiFetch<CoApproval>(`${buyerDeal(d)}/co-approval`),
  turnOnCoApproval: (d: Deal, representativeId: string) =>
    post<CoApproval>(`${buyerDeal(d)}/co-approval`, { representativeId }),
  disableCoApproval: (d: Deal) => post<CoApproval>(`${buyerDeal(d)}/co-approval/disable`),
  keepCoApproval: (d: Deal) => post<CoApproval>(`${buyerDeal(d)}/co-approval/keep`),

  /** `name`, `email` and `phoneMasked` are the buyer's. */
  representing: () => apiFetch<Appointment[]>('/land/representing'),
  respond: (id: string, response: 'ACCEPT' | 'DECLINE') =>
    post<unknown>(`/land/representing/${id}/respond`, { response }),
  resign: (id: string, reason: string) =>
    post<unknown>(`/land/representing/${id}/resign`, { reason: reason.trim() }),
  principalDeals: (principalId: string) =>
    apiFetch<PrincipalDeals>(
      `/land/representing/principals/${encodeURIComponent(principalId)}/deals`
    ),
  representedPurchase: (id: string) =>
    apiFetch<BuyerPurchaseDetail>(`/land/representing/purchases/${encodeURIComponent(id)}`),
  representedTransaction: (txId: string) =>
    apiFetch<Milestone[]>(`/land/representing/transactions/${encodeURIComponent(txId)}`),
  representedCoApproval: (d: Deal) => apiFetch<CoApproval>(`${representingDeal(d)}/co-approval`),
  representativeApprove: (d: Deal, key: string) =>
    post<unknown>(`${representingDeal(d)}/milestones/${encodeURIComponent(key)}/approve`),
  /** My second approval to releasing a built home's held deposit. It never moves money itself. */
  approveDepositRelease: (txId: string) =>
    post<CoApproval & { outcome: DepositReleaseApprovalOutcome }>(
      `/representing/transactions/${encodeURIComponent(txId)}/deposit-release/approve`
    ),
};
