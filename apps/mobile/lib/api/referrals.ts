import { apiFetch } from './client';

export interface ReferredUser {
  name: string;
  rewardAmount: number;
  date: string;
}

export interface ReferralSummary {
  code: string;
  totalReferred: number;
  totalEarned: number;
  referrals: ReferredUser[];
  referredByName?: string;
  refereeRewardAmount?: number;
}

export const referralsApi = {
  getSummary: () => apiFetch<ReferralSummary>('/referrals/summary'),
};
