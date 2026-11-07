import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  Crown,
  Mail,
  Phone,
  Shield,
  Star,
  User,
  Users,
  Award,
  ClipboardCheck,
} from 'lucide-react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import type { TrustBadge, TrustProfile, VerificationItem } from '@/lib/api/buyerTrustProfile';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { TrustOverview } from '@/components/trust/TrustOverview';
import type { TrustPortal, TrustRequirementKey } from '@/lib/api/trust';

const ICONS: Record<string, typeof Shield> = {
  User,
  Mail,
  Phone,
  Shield,
  Users,
  CheckCircle,
  Star,
  Crown,
  Award,
  ClipboardCheck,
};

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  const Comp = ICONS[name] ?? Shield;
  return <Comp size={size} color={color} />;
}

/** Where each requirement is done, per portal. */
const PROFILE_ROUTE: Record<ProfilePortal, Href> = {
  owner: '/(app)/owner-profile',
  realtor: '/(app)/realtor-profile',
  buyer: '/(app)/buyer-profile',
  agent: '/(app)/edit-profile',
};
function routeFor(portal: ProfilePortal, key: TrustRequirementKey): Href {
  switch (key) {
    case 'EMAIL':
      return PROFILE_ROUTE[portal];
    case 'PROFESSIONAL_LICENCE':
      return '/(app)/license-verification';
    case 'PROPERTY_OWNERSHIP':
      return '/(app)/(owner)/properties';
    default:
      // Phone, NIN, live selfie and the bank check live on the verification screen.
      return '/(app)/verify-identity';
  }
}

type ProfilePortal = Extract<TrustPortal, 'owner' | 'agent' | 'realtor' | 'buyer'>;

/**
 * Trust & Verification for owners, agents, realtors and buyers: the shared
 * overview, then what others see on the profile, folded into the details.
 */
export function TrustProfileView({
  portal,
  queryKey,
  queryFn,
  eyebrow,
  audience,
}: {
  portal: ProfilePortal;
  queryKey: readonly unknown[];
  queryFn: () => Promise<TrustProfile>;
  eyebrow: string;
  /** Who sees the profile, e.g. "buyers and realtors". */
  audience: string;
}) {
  const { colors, spacing } = useTheme();
  const profile = useQuery({ queryKey, queryFn });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow={eyebrow}
        title="Trust & verification"
        subtitle="Your identity, what you need here, and your trust score"
        onBack={() => goBack()}
      />
      <TrustOverview
        portal={portal}
        onAction={(key) => router.push(routeFor(portal, key))}
        moreDetails={
          profile.data ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="bodyStrong">What {audience} see</Text>
              {profile.data.verifications.map((v: VerificationItem) => (
                <View
                  key={v.id}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                >
                  <Icon
                    name={v.icon}
                    size={14}
                    color={v.verified ? colors.success : colors.mutedForeground}
                  />
                  <Text variant="caption" style={{ flex: 1 }}>
                    {v.label}
                  </Text>
                  {v.verified ? <CheckCircle size={14} color={colors.success} /> : null}
                </View>
              ))}
              {profile.data.badges.some((b: TrustBadge) => b.earned) ? (
                <Text variant="caption" color="mutedForeground">
                  Badges:{' '}
                  {profile.data.badges
                    .filter((b: TrustBadge) => b.earned)
                    .map((b: TrustBadge) => b.name)
                    .join(', ')}
                </Text>
              ) : null}
            </View>
          ) : null
        }
      />
    </View>
  );
}
