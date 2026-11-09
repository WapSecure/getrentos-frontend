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

export interface TrustScoreDimension {
  id: string;
  label: string;
  earned: number;
  weight: number;
}

export interface TrustStage {
  id: string;
  label: string;
  blurb: string;
  min: number;
}

/** Only sent while the dimension engine is on; the UI must degrade gracefully. */
export interface TrustScoreBreakdown {
  version: string;
  total: number;
  earned: number;
  penalty: number;
  dimensions: TrustScoreDimension[];
  stage?: TrustStage;
  reasonCodes: string[];
}

export interface TrustProfile {
  trustScore: number;
  /** No longer sent: an all-account average is not a fair comparison. */
  averageScore?: number;
  verifications: VerificationItem[];
  history: TrustScoreHistoryItem[];
  badges: Badge[];
  stats: TrustProfileStat[];
  scoreBreakdown?: TrustScoreBreakdown;
}

/**
 * The numbers come from the deterministic score engine; the wording is AI or a template (see
 * `source`).
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

export type TrustStatus =
  | 'NOT_STARTED'
  | 'ACTION_REQUIRED'
  | 'IN_PROGRESS'
  | 'PENDING_PROVIDER'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'FAILED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVERIFICATION_REQUIRED'
  | 'UNAVAILABLE';

export type TrustRequirementKey =
  | 'EMAIL'
  | 'PHONE'
  | 'ID_NUMBER'
  | 'LIVE_SELFIE'
  | 'BANK_ACCOUNT'
  | 'PROFESSIONAL_LICENCE'
  | 'BUSINESS_REGISTRATION'
  | 'PROPERTY_OWNERSHIP';

export interface TrustRequirement {
  key: TrustRequirementKey;
  label: string;
  status: TrustStatus;
  detail: string;
  why: string;
  updatedAt?: string;
  dueBy?: string;
}

export type TrustPortal =
  | 'renter'
  | 'buyer'
  | 'landlord'
  | 'owner'
  | 'agent'
  | 'realtor'
  | 'manager';

/** From stored records only. */
export interface TrustOverview {
  portal: TrustPortal;
  identity: {
    status: TrustStatus;
    method?: 'INSTANT_CHECKS' | 'DOCUMENT_AND_LIVE_SELFIE' | 'DOCUMENT_GRACE';
    detail: string;
    dueBy?: string;
  };
  requirements: TrustRequirement[];
  tier: { level: number; label: string };
  /** Null while scoring is switched off: no number is shown in its place. */
  score: TrustScoreBreakdown | null;
  nextAction: { key: TrustRequirementKey; label: string } | null;
  lastUpdatedAt?: string;
  /** Checks no provider we use can do yet; never a requirement. Absent from older APIs. */
  notOffered?: { key: string; label: string; detail: string }[];
}
