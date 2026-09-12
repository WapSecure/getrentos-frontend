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

/** One dimension of the trust score, resolved for display (earned of weight). */
export interface TrustScoreDimension {
  id: string;
  label: string;
  earned: number;
  weight: number;
}

/**
 * How the score decomposes (dimension.v1). Optional: the backend only sends it
 * while the dimension engine is on, so the UI must degrade gracefully.
 */
export interface TrustScoreBreakdown {
  version: string;
  total: number;
  earned: number;
  penalty: number;
  dimensions: TrustScoreDimension[];
  reasonCodes: string[];
}

/** Role-appropriate trust profile returned by /<role>/trust-profile. */
export interface TrustProfile {
  trustScore: number;
  averageScore: number;
  verifications: VerificationItem[];
  history: TrustScoreHistoryItem[];
  badges: Badge[];
  stats: TrustProfileStat[];
  scoreBreakdown?: TrustScoreBreakdown;
}
