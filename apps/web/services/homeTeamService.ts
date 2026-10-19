import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export interface HomeTeam {
  leaseId: string;
  propertyId: string;
  propertyTitle: string;
  managedBy: string | null;
  people: { name: string; role: string; phone: string | null; email: string | null }[];
}

export type CheckKind = 'PHONE' | 'EMAIL' | 'BANK_ACCOUNT';
export type CheckResult =
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

export function homeTeam(): Promise<ApiResponse<HomeTeam[]>> {
  return safeCall(() => authFetch<HomeTeam[]>('/renter/home-team'));
}

export function checkContact(kind: CheckKind, value: string): Promise<ApiResponse<CheckResult>> {
  return safeCall(() =>
    authFetch<CheckResult>('/renter/home-team/check', {
      method: 'POST',
      body: JSON.stringify({ kind, value }),
    })
  );
}

export function reportImpersonation(input: {
  leaseId?: string;
  channel: ImpersonationChannel;
  contactValue?: string;
  claimedToBe: string;
  description: string;
  amountAsked?: number;
  paid?: boolean;
}): Promise<ApiResponse<{ id: string; status: string }>> {
  return safeCall(() =>
    authFetch<{ id: string; status: string }>('/renter/home-team/reports', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  );
}
