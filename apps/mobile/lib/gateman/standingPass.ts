import type { VisitorPass } from '@/lib/api/visitor-pass';

// One file per platform so the phone and the desktop give the same explanation.
export function describeStandingPass(pass: Pick<VisitorPass, 'source' | 'purpose'>): string | null {
  if (pass.source !== 'contractor') return null;

  // No trailing full stop: callers append this to a line of their own.
  const trade = pass.purpose?.trim();
  return trade
    ? `On a standing pass the estate office issued: ${trade}`
    : 'On a standing pass the estate office issued, not a one-off invitation';
}
