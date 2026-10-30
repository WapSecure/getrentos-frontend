/**
 * Trust scores run 0-100. The bands live in one place because the renter
 * dashboard card and the trust-score page must never disagree about what a
 * number means — the dashboard card hardcoded "Excellent Trust Score" for every
 * score, so a renter on 27 was congratulated on one screen while the page one
 * click away classified the same 27 as needing improvement.
 */
export interface TrustBand {
  label: string;
  /** Tailwind text colour for the band. */
  color: string;
}

/**
 * Bands mirror the backend trust STAGE ladder (score.dimensions.ts) so the
 * wording is identical everywhere — the stage banner, the header and the
 * dashboard card all say "Building"/"Established"/… rather than one screen
 * saying "Building" and another "Needs Improvement" for the same score.
 */
export function trustBand(score: number): TrustBand {
  if (score >= 85) return { label: 'Highly trusted', color: 'text-green-600' };
  if (score >= 70) return { label: 'Trusted', color: 'text-green-600' };
  if (score >= 50) return { label: 'Established', color: 'text-blue-600' };
  if (score >= 25) return { label: 'Building', color: 'text-yellow-600' };
  return { label: 'New', color: 'text-muted-foreground' };
}
