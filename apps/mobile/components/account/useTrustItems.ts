import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Gauge, ShieldCheck } from '@sureground/icons/native';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { qk } from '@/lib/query/keys';
import { trustApi, type TrustPortal } from '@/lib/api/trust';
import type { SettingsItem } from './SettingsList';

type AccountPortal = Exclude<TrustPortal, 'manager'>;

const TRUST_SCREEN: Record<AccountPortal, Href> = {
  renter: '/(app)/trust-score',
  buyer: '/(app)/buyer-trust-profile',
  owner: '/(app)/owner-trust-profile',
  realtor: '/(app)/realtor-trust-profile',
  agent: '/(app)/agent-trust-profile',
  landlord: '/(app)/landlord-trust-profile',
  estate: '/(app)/estate-trust-profile',
};

const NEW_ACCOUNT_SCORE = 20;

export function useTrustItems(
  portal: AccountPortal,
  { identityHint, audience }: { identityHint?: string; audience: string }
): SettingsItem[] {
  const identity = useIdentityVerification();
  const overview = useQuery({
    queryKey: qk.trust.overview(portal),
    queryFn: () => trustApi.overview(portal),
  });
  const score = overview.data?.score?.total;

  return [
    {
      key: 'identity',
      label: 'Identity verification',
      description: identity.verified ? undefined : identityHint,
      icon: ShieldCheck,
      value: identity.label,
      tone: identity.verified ? 'success' : identity.known ? 'warning' : undefined,
      onPress: () => router.push('/(app)/verify-identity'),
    },
    {
      key: 'trust',
      label: 'Trust score',
      // A brand-new account scores near zero; a bare "4 / 100" reads as a warning to the people who see it.
      description:
        score != null && score < NEW_ACCOUNT_SCORE
          ? `Verify and complete your first deals to build what ${audience} see`
          : `Your score and what ${audience} see`,
      icon: Gauge,
      value:
        score == null ? undefined : score < NEW_ACCOUNT_SCORE ? 'Just starting' : `${score} / 100`,
      onPress: () => router.push(TRUST_SCREEN[portal]),
    },
  ];
}
