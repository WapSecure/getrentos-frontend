import type { BadgeTone } from '@getrentos/ui-native';
import { apiFetch } from './client';

/** The tenant's deposit (web: components/renter/home/DepositSection.tsx). */
export interface TenantDeduction {
  id: string;
  amount: number;
  reason: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  fromInspection: boolean;
  createdAt: string;
  decisionNote: string | null;
  disputedAt: string | null;
  disputeReason: string | null;
  disputeAnsweredAt: string | null;
  disputeAnswer: string | null;
  canDispute: boolean;
}

export interface DepositHold {
  id: string;
  amount: number;
  status: 'HELD' | 'PARTIALLY_RETURNED' | 'RETURNED';
  heldByGetRentos: boolean;
  heldBy: string | null;
  takenAt: string;
  returnedAt: string | null;
  returnedAmount: number | null;
  summary: {
    held: number;
    approvedDeductions: number;
    proposedDeductions: number;
    returnable: number;
  };
  deductions: TenantDeduction[];
}

export interface TenantDeposit {
  leaseId: string;
  leaseStatus: string;
  propertyTitle: string;
  unitName: string;
  agreedAmount: number;
  paidThroughGetRentos: { amount: number; paid: boolean; paidDate: string | null } | null;
  hold: DepositHold | null;
}

export const DEDUCTION_STATUS: Record<
  TenantDeduction['status'],
  { label: string; tone: BadgeTone }
> = {
  PROPOSED: { label: 'Proposed, not agreed', tone: 'warning' },
  APPROVED: { label: 'Deducted', tone: 'danger' },
  REJECTED: { label: 'Dropped', tone: 'neutral' },
};

/** What comes (or came) back to the tenant from a hold. */
export const depositBack = (hold: DepositHold) =>
  hold.status === 'RETURNED' ? (hold.returnedAmount ?? 0) : hold.summary.returnable;

/** Deposits with a hold first, then by agreed amount, so the live one leads. */
export const sortDeposits = (list: TenantDeposit[]) =>
  [...list].sort((a, b) => Number(!!b.hold) - Number(!!a.hold));

/** The people verified to act for a tenant's home (web: HomeTeamCard). */
export interface HomeTeam {
  leaseId: string;
  propertyId: string;
  propertyTitle: string;
  managedBy: string | null;
  people: { name: string; role: string; phone: string | null; email: string | null }[];
}

export type ContactKind = 'PHONE' | 'EMAIL' | 'BANK_ACCOUNT';
export type ContactVerdict =
  | { verdict: 'VERIFIED'; name: string; role: string; propertyTitle: string }
  | { verdict: 'UNKNOWN' }
  | { verdict: 'NEVER_PAY_OUTSIDE' }
  | { verdict: 'INVALID'; message: string };

export type ImpersonationChannel =
  | 'PHONE'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'BANK_ACCOUNT'
  | 'IN_PERSON'
  | 'OTHER';

export const CONTACT_KINDS: { value: ContactKind; label: string }[] = [
  { value: 'PHONE', label: 'Phone number' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'BANK_ACCOUNT', label: 'Bank account' },
];

export const IMPERSONATION_CHANNELS: { value: ImpersonationChannel; label: string }[] = [
  { value: 'PHONE', label: 'Call or SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'BANK_ACCOUNT', label: 'Asked me to pay an account' },
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'OTHER', label: 'Something else' },
];

/** What to tell the tenant about a contact they checked, and how loudly. */
export function verdictAlert(r: ContactVerdict): { tone: 'success' | 'error'; message: string } {
  switch (r.verdict) {
    case 'VERIFIED':
      return {
        tone: 'success',
        message: `This is ${r.name}, ${r.role.toLowerCase()} for ${r.propertyTitle}. Even so, only pay rent in GetRentos.`,
      };
    case 'NEVER_PAY_OUTSIDE':
      return {
        tone: 'error',
        message:
          'Do not pay into any bank account, whoever asks. Your landlord and manager are paid by GetRentos; you pay only in GetRentos. If someone asked you to pay this account, report it below.',
      };
    case 'INVALID':
      return { tone: 'error', message: r.message };
    default:
      return {
        tone: 'error',
        message:
          'This is not anyone who manages your home. Do not pay them or share codes or documents. Report it below.',
      };
  }
}

export const reportReady = (claimedToBe: string, description: string) =>
  claimedToBe.trim().length >= 2 && description.trim().length >= 10;

/** The phrase web asks for before deleting a renter account. */
export const DELETE_PHRASE = 'delete my account';
export const deletePhraseOk = (typed: string) => typed.trim().toLowerCase() === DELETE_PHRASE;

export const renterHomeApi = {
  deposits: () => apiFetch<TenantDeposit[]>('/renter/deposits'),
  disputeDeduction: (deductionId: string, reason: string) =>
    apiFetch<{ disputed: boolean }>(`/renter/deposits/deductions/${deductionId}/dispute`, {
      method: 'POST',
      body: { reason },
    }),

  homeTeam: () => apiFetch<HomeTeam[]>('/renter/home-team'),
  checkContact: (kind: ContactKind, value: string) =>
    apiFetch<ContactVerdict>('/renter/home-team/check', {
      method: 'POST',
      body: { kind, value },
    }),
  reportImpersonation: (input: {
    leaseId?: string;
    channel: ImpersonationChannel;
    contactValue?: string;
    claimedToBe: string;
    description: string;
    amountAsked?: number;
    paid?: boolean;
  }) =>
    apiFetch<{ id: string; status: string }>('/renter/home-team/reports', {
      method: 'POST',
      body: input,
    }),

  deleteAccount: (password: string) =>
    apiFetch<{ message: string }>('/renter/settings/account', {
      method: 'DELETE',
      body: { password },
    }),
};
