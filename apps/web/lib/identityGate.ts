import type { KycStatus } from '@/services/kycService';

export type IdentityGate = 'unknown' | 'verified' | 'in_review' | 'unverified';

/** `identityVerified` wins, else tier 2+ or the legacy flag; 'unknown' until loaded so callers never block. */
export function identityGate(
  status: Pick<KycStatus, 'identityVerified' | 'tier' | 'isVerified' | 'identity'> | undefined
): IdentityGate {
  if (!status) return 'unknown';
  const verified = status.identityVerified ?? ((status.tier ?? 0) >= 2 || status.isVerified);
  if (verified) return 'verified';
  const review = status.identity?.status;
  return review === 'PENDING' || review === 'PENDING_REVIEW' ? 'in_review' : 'unverified';
}

export interface DepositIdentityNotice {
  message: string;
  verifyLink: boolean;
}

/** `null` while the status is unknown: the server (403 IDENTITY_REQUIRED) stays the source of truth. */
export function depositIdentityNotice(gate: IdentityGate): DepositIdentityNotice | null {
  if (gate === 'unverified') {
    return {
      message: 'Verify your identity before you pay a deposit. It takes a few minutes.',
      verifyLink: true,
    };
  }
  if (gate === 'in_review') {
    return {
      message: 'Your identity check is being reviewed. You can pay the deposit once it clears.',
      verifyLink: false,
    };
  }
  return null;
}
