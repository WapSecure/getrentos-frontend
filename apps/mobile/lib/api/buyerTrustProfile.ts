import { apiFetch } from './client';

export interface VerificationItem {
  id: string;
  label: string;
  verified: boolean;
  date?: string;
  description: string;
  icon: string;
}

export interface TrustScoreHistoryItem {
  date: string;
  score: number;
  change: number;
  reason: string;
}

export interface TrustBadge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  description: string;
}

export interface TrustProfileStat {
  label: string;
  value: string;
}

export interface TrustProfile {
  trustScore: number;
  averageScore: number;
  verifications: VerificationItem[];
  history: TrustScoreHistoryItem[];
  badges: TrustBadge[];
  stats: TrustProfileStat[];
}

export const buyerTrustProfileApi = {
  get: () => apiFetch<TrustProfile>('/buyer/trust-profile'),
};
