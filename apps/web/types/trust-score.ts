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

/** Plain-language stage over the 0–100 score (New / Building / …). */
export interface TrustStage {
  id: string;
  label: string;
  blurb: string;
  min: number;
}

/**
 * How the score decomposes (dimension.v2). Optional: the backend only sends it
 * while the dimension engine is on, so the UI must degrade gracefully.
 */
export interface TrustScoreBreakdown {
  version: string;
  total: number;
  earned: number;
  penalty: number;
  dimensions: TrustScoreDimension[];
  /** The stage band this score sits in, for a wording-first UI. */
  stage?: TrustStage;
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

/**
 * Plain-language explanation of the caller's own trust score, from
 * GET /trust-score/explanation. The numbers come from the deterministic score
 * engine; `summary`/`strengths`/`improvements` are phrased (by AI when
 * configured, else a deterministic template — see `source`).
 */
export interface TrustExplanation {
  total: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  source: 'ai' | 'heuristic';
  model: string | null;
  generatedAt: string;
}
