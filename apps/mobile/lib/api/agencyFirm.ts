import type { BadgeTone } from '@getrentos/ui-native';
import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';

/**
 * Running the firm itself: its team, commissions and payouts, client-money
 * protection, performance, and setting the firm up or joining one. Firm-wide,
 * so none of it depends on which client is selected.
 */

/* ---------------------------------- team ---------------------------------- */

export type AgencyRole =
  | 'OWNER'
  | 'STAFF'
  | 'ACCOUNTANT'
  | 'PORTFOLIO_MANAGER'
  | 'LEASING_AGENT'
  | 'MAINTENANCE_COORDINATOR'
  | 'INSPECTOR';

/** Roles a principal can give, with what each is for. */
export const ASSIGNABLE_ROLES: {
  value: Exclude<AgencyRole, 'OWNER'>;
  label: string;
  hint: string;
}[] = [
  {
    value: 'PORTFOLIO_MANAGER',
    label: 'Portfolio manager',
    hint: 'Runs client properties day to day',
  },
  { value: 'LEASING_AGENT', label: 'Leasing agent', hint: 'Listings, viewings, applications' },
  {
    value: 'MAINTENANCE_COORDINATOR',
    label: 'Maintenance coordinator',
    hint: 'Repairs and vendors',
  },
  { value: 'INSPECTOR', label: 'Inspector', hint: 'Condition reports' },
  {
    value: 'ACCOUNTANT',
    label: 'Accountant',
    hint: 'Finance only — no access to client properties',
  },
  { value: 'STAFF', label: 'Staff', hint: 'General team member' },
];

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: AgencyRole;
  roleLabel: string;
  joinedAt: string;
  expiresAt: string | null;
  suspendedAt: string | null;
  state: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
}

export const MEMBER_STATE: Record<TeamMember['state'], { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  SUSPENDED: { label: 'Suspended', tone: 'warning' },
  EXPIRED: { label: 'Ended', tone: 'neutral' },
};

export interface TeamInvitation {
  id: string;
  email: string;
  roleLabel: string;
  membershipExpiresAt: string | null;
  expiresAt: string;
  status: 'PENDING' | 'EXPIRED';
}

/** The principal is the member with the OWNER role; only they manage the team. */
export const isPrincipal = (members: TeamMember[], userId: string | undefined) =>
  !!userId && members.some((m) => m.role === 'OWNER' && m.userId === userId);

/** A chosen `yyyy-MM-dd` as the end of that day in Lagos, or null for no end. */
export const endOfDayLagos = (date: string) =>
  date ? new Date(`${date}T23:59:59+01:00`).toISOString() : null;

/* ------------------------------- commissions ------------------------------ */

export interface Commission {
  id: string;
  type: 'LETTING' | 'RENEWAL';
  ownerName: string | null;
  propertyTitle: string | null;
  baseAmount: number;
  ratePct: number;
  amount: number;
  status: 'EARNED' | 'PAID' | 'VOID';
  earnedAt: string;
  attributedUserId: string | null;
  attributedName: string | null;
  agentShareAmount: number | null;
}

export interface CommissionsSummary {
  config: { lettingPct: number; renewalPct: number };
  totals: { earned: number; paid: number; count: number };
  commissions: Commission[];
}

export interface CommissionTeam {
  members: {
    userId: string;
    name: string;
    email: string;
    role: AgencyRole;
    splitPct: number;
    deals: number;
    commissionTotal: number;
    shareTotal: number;
  }[];
  unassigned: { deals: number; commissionTotal: number };
}

/** Whole percentages between 0 and 100, as the rate card needs. */
export function rateProblem(letting: string, renewal: string): string | null {
  const a = Number(letting);
  const b = Number(renewal);
  if (!letting.trim() || !renewal.trim() || !Number.isFinite(a) || !Number.isFinite(b)) {
    return 'Enter both rates as whole percentages.';
  }
  if (a < 0 || a > 100 || b < 0 || b > 100) return 'Rates must be between 0 and 100.';
  return null;
}

export const splitProblem = (v: string) => {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) && n >= 0 && n <= 100 ? null : 'Between 0 and 100.';
};

/* --------------------------------- payouts -------------------------------- */

export interface PayoutAccount {
  bankCode: string;
  bankName: string | null;
  accountNumber: string;
  accountName: string | null;
  verified: boolean;
  payoutHoldUntil: string | null;
}

/** A bank code (3–6 digits) and a 10-digit NUBAN account number. */
export function bankProblem(bankCode: string, accountNumber: string): string | null {
  if (!/^\d{3,6}$/.test(bankCode.trim())) return 'Enter the bank code (3 to 6 digits).';
  if (!/^\d{10}$/.test(accountNumber.trim())) return 'Account numbers are 10 digits.';
  return null;
}

export const PAYOUT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Processing', tone: 'info' },
  SUCCESS: { label: 'Paid', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
};

export interface PayoutRecord {
  id?: string;
  createdAt: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  failureReason: string | null;
}

export interface PayableAgent {
  agentUserId: string;
  agentName: string;
  payable: number;
  commissions: number;
  accountSet: boolean;
  tier: number;
  payoutHeldUntil: string | null;
  ready: boolean;
}

/** Why an agent can't be paid in this run, or "Ready" (web's order). */
export function agentPayStatus(
  a: PayableAgent,
  requiredTier = 3
): { label: string; tone: BadgeTone } {
  if (a.ready) return { label: 'Ready', tone: 'success' };
  if (!a.accountSet) return { label: 'No payout account', tone: 'neutral' };
  if (a.payoutHeldUntil) return { label: 'Account changed · on hold', tone: 'warning' };
  return { label: `Needs ID tier ${requiredTier}`, tone: 'warning' };
}

/** A saved account comes back with blank fields when there is none. */
export const hasAccount = (a: PayoutAccount | null | undefined) => !!a?.accountNumber;

export interface MySummary {
  earned: number;
  paid: number;
  pending: number;
  accountSet: boolean;
  tier: number;
  withdrawTierRequired: number;
  canReceive: boolean;
  agencyName: string | null;
}

/* -------------------------------- protection ------------------------------ */

export interface ProtectionAttestation {
  id: string;
  schemeName: string;
  schemeReference: string | null;
  coverageAmount: number | null;
  segregationConfirmed: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  attestedByName: string | null;
  note: string | null;
}

export const ATTESTATION_STATUS: Record<
  ProtectionAttestation['status'],
  { label: string; tone: BadgeTone }
> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  REVOKED: { label: 'Revoked', tone: 'neutral' },
};

export function protectionProblem(f: {
  schemeName: string;
  effectiveFrom: string;
  effectiveTo: string;
}) {
  if (f.schemeName.trim().length < 2) return 'Name the scheme (at least 2 characters).';
  if (!f.effectiveFrom) return 'Choose when cover starts.';
  if (f.effectiveTo && f.effectiveTo < f.effectiveFrom) return 'Cover cannot end before it starts.';
  return null;
}

/* ------------------------------- performance ------------------------------ */

export interface KpiReport {
  scope: { kind: 'MANAGED' | 'FIRM' | 'ALL'; name: string };
  from: string;
  to: string;
  payoutTargetDays: number;
  collection: {
    billed: number;
    collected: number;
    collectionRate: number | null;
    onTimeRate: number | null;
  };
  arrears: { total: number; tenancies: number; buckets: { key: string; amount: number }[] };
  occupancy: {
    properties: number;
    units: number;
    occupiedUnits: number;
    occupancyRate: number | null;
  };
  maintenance: {
    raised: number;
    medianResponseHours: number | null;
    responseOnTimeRate: number | null;
    resolved: number;
    medianResolutionDays: number | null;
    resolutionOnTimeRate: number | null;
    openPastTarget: number;
  };
  payouts: {
    statements: number;
    onTimeRate: number | null;
    averageDaysToPay: number | null;
    overdue: number;
  };
  retention: {
    startingOwners: number;
    retained: number;
    lost: number;
    lostByOwnerChoice: number;
    retentionRate: number | null;
    gained: number;
  };
}

export const ARREARS_BUCKET: Record<string, string> = {
  DAYS_1_30: '1–30 days late',
  DAYS_31_60: '31–60 days',
  DAYS_61_90: '61–90 days',
  DAYS_90_PLUS: 'Over 90 days',
};

/** The last `count` months as `yyyy-MM`, newest first, in Lagos time. */
export function recentMonths(count = 12, now = new Date()): { value: string; label: string }[] {
  const lagos = new Date(now.getTime() + 60 * 60_000);
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth() - i, 1));
    out.push({
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
    });
  }
  return out;
}

/* ------------------------------ setup and join ---------------------------- */

export type BusinessType = 'BUSINESS_NAME' | 'LIMITED_COMPANY' | 'INCORPORATED_TRUSTEES';
export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'BUSINESS_NAME', label: 'Business name' },
  { value: 'LIMITED_COMPANY', label: 'Limited company' },
  { value: 'INCORPORATED_TRUSTEES', label: 'Incorporated trustees' },
];

export interface Onboarding {
  organizationId: string;
  name: string;
  status: 'PENDING_KYB' | 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'OFFBOARDING' | 'CLOSED';
  isOwner: boolean;
  profile: {
    registeredName: string | null;
    businessType: BusinessType | null;
    registrationNumber: string | null;
    registeredAddress: string | null;
    /** The Google place the registered address was checked against; null for a typed one. */
    registeredPlaceId?: string | null;
    state: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    certificateFileName: string | null;
    kybStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    kybSubmittedAt: string | null;
    kybDecisionNote: string | null;
  };
}

export interface SetupForm {
  name: string;
  registeredName: string;
  businessType: BusinessType;
  registrationNumber: string;
  registeredAddress: string;
  /**
   * The Google place the registered address was picked from. The API stores an
   * address saved without it as unchecked, so an edit re-sends the stored one.
   */
  registeredPlaceId?: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
}

export const setupToForm = (o: Onboarding | null): SetupForm => ({
  name: o?.name ?? '',
  registeredName: o?.profile.registeredName ?? '',
  businessType: o?.profile.businessType ?? 'LIMITED_COMPANY',
  registrationNumber: o?.profile.registrationNumber ?? '',
  registeredAddress: o?.profile.registeredAddress ?? '',
  registeredPlaceId: o?.profile.registeredPlaceId ?? undefined,
  state: o?.profile.state ?? 'Lagos',
  contactEmail: o?.profile.contactEmail ?? '',
  contactPhone: o?.profile.contactPhone ?? '',
});

const CAC_HINT =
  'Enter it as printed on the certificate, e.g. RC 1234567, BN 3456789 or IT 123456.';

/** The first thing wrong with the firm's details, in web's words, or null. */
export function setupProblem(f: SetupForm): string | null {
  if (!f.name.trim()) return 'Enter your firm’s trading name.';
  if (!f.registeredName.trim()) return 'Enter the registered name from the CAC certificate.';
  if (!f.registrationNumber.trim()) return 'Enter the CAC number.';
  if (!/^(BN|RC|IT)\s?-?\d{4,9}$/i.test(f.registrationNumber.trim())) {
    return `That CAC number does not look right. ${CAC_HINT}`;
  }
  if (f.registeredAddress.trim().length < 5) {
    return 'Enter the registered address (at least 5 characters).';
  }
  if (f.contactPhone.trim().length < 7) return 'Enter a business phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contactEmail.trim())) {
    return 'Enter a valid business email address.';
  }
  return null;
}

/** Whether the firm's details can still be changed by this person. */
export const setupEditable = (o: Onboarding | null) =>
  !o ||
  (o.isOwner && (o.profile.kybStatus === 'NOT_SUBMITTED' || o.profile.kybStatus === 'REJECTED'));

export interface JoinPreview {
  firmName: string;
  roleLabel: string;
  email: string;
  status: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'REVOKED';
  membershipExpiresAt: string | null;
  emailMatches: boolean;
}

/** The token from an invitation link, or the link pasted whole. */
export function tokenFrom(input: string): string {
  const t = input.trim();
  const m = t.match(/[?&]token=([^&#\s]+)/);
  return decodeURIComponent(m ? m[1] : t);
}

/* ----------------------------------- api ---------------------------------- */

const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', ...(body !== undefined ? { body } : {}) });

export const agencyFirmApi = {
  members: () => apiFetch<TeamMember[]>('/agency/team/members'),
  invitations: () => apiFetch<TeamInvitation[]>('/agency/team/invitations'),
  invite: (input: { email: string; role: string; membershipExpiresAt: string | null }) =>
    post<TeamInvitation>('/agency/team/invitations', input),
  revokeInvitation: (id: string) => post<unknown>(`/agency/team/invitations/${id}/revoke`),
  updateMember: (userId: string, input: { role?: string; expiresAt?: string | null }) =>
    apiFetch<TeamMember>(`/agency/team/members/${userId}`, { method: 'PATCH', body: input }),
  suspendMember: (userId: string) => post<unknown>(`/agency/team/members/${userId}/suspend`),
  reinstateMember: (userId: string) => post<unknown>(`/agency/team/members/${userId}/reinstate`),
  removeMember: (userId: string) =>
    apiFetch<unknown>(`/agency/team/members/${userId}`, { method: 'DELETE' }),

  commissions: () => apiFetch<CommissionsSummary>('/agency/commissions'),
  setRates: (lettingPct: number, renewalPct: number) =>
    apiFetch<unknown>('/agency/commissions/config', {
      method: 'PUT',
      body: { lettingPct, renewalPct },
    }),
  creditAgent: (commissionId: string, agentUserId: string | null) =>
    apiFetch<unknown>(`/agency/commissions/${commissionId}/agent`, {
      method: 'PUT',
      body: { agentUserId },
    }),
  commissionTeam: () => apiFetch<CommissionTeam>('/agency/commissions/team'),
  setSplit: (userId: string, splitPct: number) =>
    apiFetch<unknown>(`/agency/commissions/team/${userId}/split`, {
      method: 'PUT',
      body: { splitPct },
    }),

  firmPayoutAccount: () => apiFetch<PayoutAccount | null>('/agency/commissions/payout-account'),
  setFirmPayoutAccount: (bankCode: string, accountNumber: string) =>
    post<PayoutAccount>('/agency/commissions/payout-account', { bankCode, accountNumber }),
  firmPayoutSummary: () =>
    apiFetch<{ available: number; awaitingOwnerFunds: number; accountSet: boolean }>(
      '/agency/commissions/payouts/summary'
    ),
  firmPayouts: () => apiFetch<PayoutRecord[]>('/agency/commissions/payouts'),
  requestFirmPayout: () => post<unknown>('/agency/commissions/payouts/request'),
  payableAgents: () => apiFetch<PayableAgent[]>('/agency/commissions/agent-payouts/payable'),
  payAgents: () =>
    post<{ paid: unknown[]; skipped: { agentName: string; reason: string }[] }>(
      '/agency/commissions/agent-payouts/run'
    ),
  myPayoutAccount: () =>
    apiFetch<PayoutAccount | null>('/agency/commissions/agent-payouts/my-account'),
  setMyPayoutAccount: (bankCode: string, accountNumber: string) =>
    post<PayoutAccount>('/agency/commissions/agent-payouts/my-account', {
      bankCode,
      accountNumber,
    }),
  mySummary: () => apiFetch<MySummary>('/agency/commissions/agent-payouts/my-summary'),
  myPayouts: () => apiFetch<PayoutRecord[]>('/agency/commissions/agent-payouts/my-payouts'),

  protection: () => apiFetch<ProtectionAttestation[]>('/agency/protection'),
  attest: (input: {
    schemeName: string;
    schemeReference?: string;
    coverageAmount?: number;
    segregationConfirmed: boolean;
    effectiveFrom: string;
    effectiveTo?: string;
    note?: string;
  }) => post<ProtectionAttestation>('/agency/protection', input),
  revokeAttestation: (id: string) => post<unknown>(`/agency/protection/${id}/revoke`),

  kpis: (from: string, to: string) => apiFetch<KpiReport>(`/agency/kpis?from=${from}&to=${to}`),

  onboarding: () => apiFetch<Onboarding>('/agency/onboarding'),
  createFirm: (input: SetupForm) => post<Onboarding>('/agency/onboarding', input),
  updateFirm: (input: SetupForm) =>
    apiFetch<Onboarding>('/agency/onboarding', { method: 'PUT', body: input }),
  uploadCertificate: (file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<Onboarding>('/agency/onboarding/certificate', form);
  },
  submitFirm: () => post<Onboarding>('/agency/onboarding/submit'),

  joinPreview: (token: string) => post<JoinPreview>('/agency/team/join/preview', { token }),
  join: (token: string) => post<unknown>('/agency/team/join', { token }),
};
