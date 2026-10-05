/**
 * Trust-score history entries carry a `reason` that is sometimes an internal
 * engine code (e.g. `dimension.v1:backfill`) rather than human copy. Those must
 * never reach the renter verbatim, so this maps the known codes and turns any
 * other code-looking string into a neutral phrase. Real sentences pass through.
 */
const KNOWN_REASONS: Record<string, string> = {
  'dimension.v1:backfill': 'Initial score calculated',
};

export function humanizeScoreReason(reason: string): string {
  if (!reason) return 'Score updated';
  const known = KNOWN_REASONS[reason];
  if (known) return known;
  // A real reason reads as a phrase; an internal code is one token of
  // dot/colon-joined segments with no spaces. Don't surface the raw code.
  if (!/\s/.test(reason) && /[.:]/.test(reason)) return 'Score updated';
  return reason;
}
