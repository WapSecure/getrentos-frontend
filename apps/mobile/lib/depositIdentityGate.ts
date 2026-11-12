import type { KycStatusResponse } from '@/lib/api/kyc';

export interface DepositIdentityNotice {
  message: string;
  /** Offer the way to verify; not while a check is already in review. */
  verifyLink: boolean;
}

/**
 * What the pay deposit sheet says to a buyer the server will refuse (403 IDENTITY_REQUIRED, the
 * same rule as making an offer). Same verified rule as useIdentityVerified. `null` when they can
 * pay, or while the status has not loaded or failed: the server stays the source of truth.
 */
export function depositIdentityNotice(
  status: Pick<KycStatusResponse, 'identityVerified' | 'identity'> | undefined
): DepositIdentityNotice | null {
  if (!status) return null;
  const verified = status.identityVerified ?? status.identity?.status === 'APPROVED';
  if (verified) return null;
  if (status.identity?.status === 'PENDING_REVIEW') {
    return {
      message: 'Your identity check is being reviewed. You can pay the deposit once it clears.',
      verifyLink: false,
    };
  }
  return {
    message: 'Verify your identity before you pay a deposit. It takes a few minutes.',
    verifyLink: true,
  };
}
