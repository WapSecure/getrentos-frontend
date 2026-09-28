import type { VisitorPass } from '@/lib/api/visitor-pass';

/**
 * What a gate console says about an arrival that came in on a standing pass.
 *
 * A contractor's credential is not a one-off invitation a household issued, so
 * there is no pass with their name on it that the household raised. Without a
 * line saying so, a guard sees an ordinary check-in and nothing explains why the
 * person at the barrier never had a pass of their own — which is the first
 * question anybody reviewing the log will ask.
 *
 * The wording lives in one file per platform rather than inline in each console,
 * so the phone and the desktop cannot drift into two different explanations of
 * the same event.
 */
export function describeStandingPass(pass: Pick<VisitorPass, 'source' | 'purpose'>): string | null {
  if (pass.source !== 'contractor') return null;

  // The API writes a contractor visit's purpose as "company · trade", so this
  // reads as "issued — Zenith Electrical · Electrician": who the estate let in,
  // in the estate's own words. No trailing full stop on either branch, because a
  // caller appends this to a line of its own and the API's punctuation is not
  // ours to double.
  const trade = pass.purpose?.trim();
  return trade
    ? `On a standing pass the estate office issued — ${trade}`
    : 'On a standing pass the estate office issued, not a one-off invitation';
}
