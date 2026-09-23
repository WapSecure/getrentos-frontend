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

export function trustBand(score: number): TrustBand {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-600' };
  if (score >= 50) return { label: 'Fair', color: 'text-yellow-600' };
  return { label: 'Needs Improvement', color: 'text-red-600' };
}
