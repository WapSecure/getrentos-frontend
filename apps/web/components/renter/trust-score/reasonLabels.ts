// Some reasons are internal engine codes (e.g. `dimension.v1:backfill`) that must never reach the renter verbatim.
const KNOWN_REASONS: Record<string, string> = {
  'dimension.v1:backfill': 'Initial score calculated',
};

export function humanizeScoreReason(reason: string): string {
  if (!reason) return 'Score updated';
  const known = KNOWN_REASONS[reason];
  if (known) return known;
  // A code is one token of dot/colon-joined segments with no spaces; never surface it raw.
  if (!/\s/.test(reason) && /[.:]/.test(reason)) return 'Score updated';
  return reason;
}
