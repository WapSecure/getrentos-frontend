import type { ReactNode } from 'react';
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
} from '@sureground/icons/native';
import { Text, useTheme } from '@sureground/ui-native';
import type { TrustBadge, TrustProfile, VerificationItem } from '@/lib/api/buyerTrustProfile';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { TrustOverview } from '@/components/trust/TrustOverview';
import type { TrustPortal, TrustRequirementKey } from '@/lib/api/trust';

type ScreenPortal = Exclude<TrustPortal, 'manager'>;

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

const PROFILE_ROUTE: Record<ScreenPortal, Href> = {
  renter: '/(app)/edit-profile',
  buyer: '/(app)/buyer-profile',
  owner: '/(app)/owner-profile',
  realtor: '/(app)/realtor-profile',
  agent: '/(app)/edit-profile',
  landlord: '/(app)/edit-profile',
  estate: '/(app)/edit-profile',
};

const OWNERSHIP_ROUTE: Partial<Record<ScreenPortal, Href>> = {
  owner: '/(app)/(owner)/properties',
  landlord: '/(app)/(landlord)/properties',
};

function routeFor(portal: ScreenPortal, key: TrustRequirementKey): Href {
  switch (key) {
    case 'EMAIL':
      return PROFILE_ROUTE[portal];
    case 'PROFESSIONAL_LICENCE':
      return '/(app)/license-verification';
    case 'PROPERTY_OWNERSHIP':
      return OWNERSHIP_ROUTE[portal] ?? '/(app)/verify-identity';
    default:
      // Phone, NIN, live selfie and the bank check live on the verification screen.
      return '/(app)/verify-identity';
  }
}

interface ProfileSource {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TrustProfile>;
  /** Who sees the profile, e.g. "owners and realtors". */
  audience: string;
}

function ProfileDetails({ queryKey, queryFn, audience }: ProfileSource) {
  const { colors, spacing } = useTheme();
  const profile = useQuery({ queryKey, queryFn });
  if (!profile.data) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">What {audience} see</Text>
      {profile.data.verifications.map((v: VerificationItem) => (
        <View key={v.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
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
  );
}

/** The trust screen every role opens from its account: identity, role needs and score. */
export function TrustScreen({
  portal,
  eyebrow,
  profile,
  moreDetails,
}: {
  portal: ScreenPortal;
  eyebrow: string;
  /** The public profile, for roles others look up. */
  profile?: ProfileSource;
  /** Anything else under the score, e.g. a renter's score history. */
  moreDetails?: ReactNode;
}) {
  const { colors } = useTheme();

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
        moreDetails={profile ? <ProfileDetails {...profile} /> : moreDetails}
      />
    </View>
  );
}
