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

/**
 * Tells someone whose identity is not yet verified what verification unlocks
 * and takes them to it, before they start a task that will be refused for it.
 * Hidden once verified, or until the status is known; `force` shows it
 * regardless, for a screen that has just had an action refused.
 */
export function IdentityNudge({ unlocks, force = false }: { unlocks: string; force?: boolean }) {
  const verified = useIdentityVerified();
  if (!force && verified !== false) return null;
  return (
    <AttentionCard
      Icon={ShieldAlert}
      tone="warning"
      title="Verify your identity"
      detail={`Unlocks ${unlocks}: takes two minutes`}
      accessibilityLabel={`Verify your identity. Unlocks ${unlocks}.`}
      onPress={() => router.push('/(app)/verify-identity')}
    />
  );
}
