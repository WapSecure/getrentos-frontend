import type { VisitorPass } from '@/types/estate';

// Kept word for word with the mobile copy so phone and desktop explain the same event the same way.
export function describeStandingPass(pass: Pick<VisitorPass, 'source' | 'purpose'>): string | null {
  if (pass.source !== 'contractor') return null;

  // No trailing full stop: callers append this to their own line.
  const trade = pass.purpose?.trim();
  return trade
    ? `On a standing pass the estate office issued: ${trade}`
    : 'On a standing pass the estate office issued, not a one-off invitation';
}
