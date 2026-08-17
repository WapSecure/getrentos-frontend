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

export interface Badge {
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

/** Role-appropriate trust profile returned by /<role>/trust-profile. */
export interface TrustProfile {
  trustScore: number;
  averageScore: number;
  verifications: VerificationItem[];
  history: TrustScoreHistoryItem[];
  badges: Badge[];
  stats: TrustProfileStat[];
}
