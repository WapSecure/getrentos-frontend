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

/**
 * The same two trust rows on every role's account screen: identity, then the
 * trust screen. The score shown is the one that screen shows.
 */
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
      description: `Your score and what ${audience} see`,
      icon: Gauge,
      value: score != null ? `${score} / 100` : undefined,
      onPress: () => router.push(TRUST_SCREEN[portal]),
    },
  ];
}
