export const TIER_LABELS: Record<number, string> = {
  0: 'Unverified',
  1: 'Contact verified',
  2: 'Identity verified',
  3: 'Financially verified',
  4: 'Role verified',
  5: 'Trusted actor',
};

/** A tier of 2+ can come from older approvals, so an explicit `identityVerified: false` wins. */
export function trustTierLabel(tier: number, identityVerified?: boolean): string {
  if (tier >= 2 && identityVerified === false) return 'Identity not verified yet';
  return TIER_LABELS[tier] ?? `Trust tier ${tier}`;
}
