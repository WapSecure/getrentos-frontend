import { useQuery } from '@tanstack/react-query';
import { kycApi } from '@/lib/api/kyc';

/** `profile.isVerified` only means the signup email or phone passed its code; identity is the KYC status. */
export function useIdentityVerification() {
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  const data = kyc.data;
  const verified = !!data && (data.identityVerified ?? data.identity?.status === 'APPROVED');
  const inReview = !verified && data?.identity?.status === 'PENDING_REVIEW';
  const label = !data ? undefined : verified ? 'Verified' : inReview ? 'In review' : 'Not verified';
  return { verified, known: !!data, label };
}
