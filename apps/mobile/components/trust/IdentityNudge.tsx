import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from '@sureground/icons/native';
import { kycApi } from '@/lib/api/kyc';
import { AttentionCard } from '@/components/dashboard/DashboardParts';
import { identityNudgeCopy, type NudgeState } from '@/lib/identityNudge';
import type { KycStatus } from '@/lib/api/kyc';

/** `null` until the answer is in, so screens don't nudge someone already verified while the request is in flight. */
export function useIdentityVerified(): boolean | null {
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  if (!kyc.data) return null;
  // The server's own answer (review or NIN); the old review row only as a fallback.
  return kyc.data.identityVerified ?? kyc.data.identity?.status === 'APPROVED';
}

export function useLicenceVerified(): boolean | null {
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  if (!kyc.data) return null;
  return kyc.data.license?.status === 'APPROVED';
}

function stateOf(status: KycStatus | undefined): NudgeState {
  if (status === 'PENDING_REVIEW') return 'pending';
  if (status === 'REJECTED' || status === 'NEEDS_CLARIFICATION') return 'rejected';
  return 'missing';
}

export function IdentityNudge({
  unlocks,
  force = false,
  requirement = 'identity',
}: {
  unlocks: string;
  force?: boolean;
  requirement?: 'identity' | 'licence';
}) {
  const identity = useIdentityVerified();
  const licence = useLicenceVerified();
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  const verified = requirement === 'licence' ? licence : identity;
  if (!force && verified !== false) return null;
  const state = stateOf(
    requirement === 'licence' ? kyc.data?.license?.status : kyc.data?.identity?.status
  );
  const copy = identityNudgeCopy({ unlocks, requirement, state });
  return (
    <AttentionCard
      Icon={ShieldAlert}
      tone={state === 'pending' ? 'info' : 'warning'}
      title={copy.title}
      detail={copy.detail}
      accessibilityLabel={copy.accessibilityLabel}
      onPress={() =>
        router.push(
          requirement === 'licence' ? '/(app)/license-verification' : '/(app)/verify-identity'
        )
      }
    />
  );
}
