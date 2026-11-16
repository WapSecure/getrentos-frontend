// A zero or missing platform trust score means no score yet, not a bad score.
export const NO_TRUST_SCORE_LABEL = 'New to Sureground';

export function hasTrustScore(score: number | null | undefined): score is number {
  return typeof score === 'number' && Number.isFinite(score) && score > 0;
}

export function trustScoreDisplay(score: number | null | undefined): string {
  return hasTrustScore(score) ? String(Math.round(score)) : NO_TRUST_SCORE_LABEL;
}
