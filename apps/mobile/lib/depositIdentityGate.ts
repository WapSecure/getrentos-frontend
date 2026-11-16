import type { KycStatusResponse } from '@/lib/api/kyc';

export interface DepositIdentityNotice {
  message: string;
  verifyLink: boolean;
}

/** `null` while the status is loading or failed: the server stays the source of truth. */
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
