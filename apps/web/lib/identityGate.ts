import type { KycStatus } from '@/services/kycService';

export type IdentityGate = 'unknown' | 'verified' | 'in_review' | 'unverified';

/**
 * Where the signed-in user stands on identity verification, for actions the server refuses
 * without it. Same rule as IdentityNudge: `identityVerified` wins, else tier 2+ or the legacy flag.
 * 'unknown' while the status has not loaded, so callers never block on a missing answer.
 */
export function identityGate(
  status: Pick<KycStatus, 'identityVerified' | 'tier' | 'isVerified' | 'identity'> | undefined
): IdentityGate {
  if (!status) return 'unknown';
  const verified = status.identityVerified ?? ((status.tier ?? 0) >= 2 || status.isVerified);
  if (verified) return 'verified';
  const review = status.identity?.status;
  return review === 'PENDING' || review === 'PENDING_REVIEW' ? 'in_review' : 'unverified';
}
