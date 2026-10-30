import { useQuery } from '@tanstack/react-query';
import { kycApi } from '@/lib/api/kyc';

/**
 * Whether the signed-in user's identity is verified. `profile.isVerified` only
 * says the signup email or phone passed its code, so badges and the identity row
 * read the KYC status instead (same query as Home and Verify identity).
 */
export function useIdentityVerification() {
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  const data = kyc.data;
  const verified = !!data && (data.identityVerified ?? data.identity?.status === 'APPROVED');
  const inReview = !verified && data?.identity?.status === 'PENDING_REVIEW';
  const label = !data ? undefined : verified ? 'Verified' : inReview ? 'In review' : 'Not verified';
  return { verified, known: !!data, label };
}
