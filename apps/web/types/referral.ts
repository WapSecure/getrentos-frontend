export type ReferralStatus = 'PENDING' | 'QUALIFIED';

export interface ReferredUser {
  name: string;
  status: ReferralStatus;
  date: string;
}

export interface ReferralSummary {
  code: string;
  totalReferred: number;
  totalQualified: number;
  referrals: ReferredUser[];
  referredByName?: string;
}
