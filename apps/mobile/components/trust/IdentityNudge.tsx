import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react-native';
import { kycApi } from '@/lib/api/kyc';
import { AttentionCard } from '@/components/dashboard/DashboardParts';

/**
 * Whether the server considers this person's identity verified. `null` until
 * the answer is in, so screens don't nudge someone who is already verified
 * while the request is in flight.
 */
export function useIdentityVerified(): boolean | null {
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  if (!kyc.data) return null;
  // The server's own answer (review or NIN); the old review row only as a fallback.
  return kyc.data.identityVerified ?? kyc.data.identity?.status === 'APPROVED';
}

/** Whether a realtor's or agent's licence has been approved; `null` until known. */
export function useLicenceVerified(): boolean | null {
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  if (!kyc.data) return null;
  return kyc.data.license?.status === 'APPROVED';
}

/**
 * Tells someone whose identity is not yet verified what verification unlocks
 * and takes them to it, before they start a task that will be refused for it.
 * Hidden once verified, or until the status is known; `force` shows it
 * regardless, for a screen that has just had an action refused.
 */
export function IdentityNudge({
  unlocks,
  force = false,
  requirement = 'identity',
}: {
  unlocks: string;
  force?: boolean;
  /** Realtors and agents are also gated on a verified licence. */
  requirement?: 'identity' | 'licence';
}) {
  const identity = useIdentityVerified();
  const licence = useLicenceVerified();
  const verified = requirement === 'licence' ? licence : identity;
  if (!force && verified !== false) return null;
  const what = requirement === 'licence' ? 'licence' : 'identity';
  return (
    <AttentionCard
      Icon={ShieldAlert}
      tone="warning"
      title={`Verify your ${what}`}
      detail={
        requirement === 'licence' ? `Unlocks ${unlocks}` : `Unlocks ${unlocks}: takes two minutes`
      }
      accessibilityLabel={`Verify your ${what}. Unlocks ${unlocks}.`}
      onPress={() =>
        router.push(
          requirement === 'licence' ? '/(app)/license-verification' : '/(app)/verify-identity'
        )
      }
    />
  );
}
