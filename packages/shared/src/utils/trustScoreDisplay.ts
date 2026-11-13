// One rule for every screen that shows someone's platform trust score: a score of zero (or a
// missing one) means the person has no score yet, not a bad score.
export const NO_TRUST_SCORE_LABEL = 'New to Sureground';

export function hasTrustScore(score: number | null | undefined): score is number {
  return typeof score === 'number' && Number.isFinite(score) && score > 0;
}

export function trustScoreDisplay(score: number | null | undefined): string {
  return hasTrustScore(score) ? String(Math.round(score)) : NO_TRUST_SCORE_LABEL;
}
