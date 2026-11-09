import { Alert, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Constants from 'expo-constants';
import {
  Bell,
  BellRing,
  CircleHelp,
  FileSignature,
  FileStack,
  Gauge,
  Handshake,
  KeyRound,
  KeySquare,
  LogOut,
  CalendarCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Wallet,
  ClipboardList,
  BadgeCheck,
  SlidersHorizontal,
  Landmark,
  MessageCircle,
} from '@sureground/icons/native';
import {
  Avatar,
  Button,
  Divider,
  Screen,
  Text,
  ThemeToggle,
  useTheme,
} from '@sureground/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useProSettings } from '@/hooks/useProSettings';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';

const go = (href: Href) => () => router.push(href);

export default function RealtorAccount() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();
  const { verified, known: identityKnown, label: identityLabel } = useIdentityVerification();
  const { licenseLabel, inAgency } = useProSettings();

  const business: SettingsItem[] = [
    {
      key: 'clients',
      label: 'Clients',
      description: 'Owners and landlords you represent',
      icon: Handshake,
      onPress: go('/(app)/realtor-clients'),
    },
    {
      key: 'offers',
      label: 'Offers',
      description: 'Negotiate on your listings',
      icon: FileSignature,
      onPress: go('/(app)/realtor-offers'),
    },
    {
      key: 'commissions',
      label: 'Commissions & payouts',
      description: 'What you’ve earned and withdrawing it',
      icon: Wallet,
      onPress: go('/(app)/realtor-commissions'),
    },
    {
      key: 'land-inspections',
      label: 'Land inspections',
      description: 'Visits assigned to you as an inspector',
      icon: ClipboardList,
      onPress: go('/(app)/land-inspections'),
    },
    {
      key: 'documents',
      label: 'Documents',
      description: 'Agency agreements, contracts, licence',
      icon: FileStack,
      onPress: go('/(app)/realtor-documents'),
    },
    {
      key: 'stays',
      label: 'Browse short stays',
      description: 'Find and book a stay as a guest',
      icon: Search,
      onPress: go('/(app)/shortlets'),
    },
    {
      key: 'my-stays',
      label: 'My stays',
      description: 'Stays you have booked as a guest',
      icon: CalendarCheck,
      onPress: go('/(app)/shortlet-bookings'),
    },
    {
      key: 'managed',
      label: 'Properties I manage',
      description: 'Authority over other owners’ property',
      icon: KeySquare,
      onPress: go('/(app)/managed-properties'),
    },
  ];

  const trust: SettingsItem[] = [
    {
      key: 'trust',
      label: 'Trust profile',
      description: 'Your score and what clients see',
      icon: Gauge,
      value: profile ? String(profile.trustScore) : undefined,
      onPress: go('/(app)/realtor-trust-profile'),
    },
    {
      key: 'identity',
      label: 'Identity verification',
      icon: ShieldCheck,
      value: identityLabel,
      tone: verified ? 'success' : identityKnown ? 'warning' : undefined,
      onPress: go('/(app)/verify-identity'),
    },
    {
      key: 'license',
      label: 'Licence',
      description: licenseLabel ?? 'Verify your realtor licence',
      icon: BadgeCheck,
      onPress: go('/(app)/license-verification'),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      description: 'What clients say about you',
      icon: Star,
      onPress: go('/(app)/realtor-reviews'),
    },
  ];

  const settings: SettingsItem[] = [
    {
      key: 'profile',
      label: 'Profile',
      description: 'Name, agency and phone',
      icon: UserRound,
      onPress: go('/(app)/realtor-profile'),
    },
    {
      key: 'preferences',
      label: 'Business preferences',
      description: 'Commission rate, areas and property types',
      icon: SlidersHorizontal,
      onPress: go('/(app)/realtor-preferences'),
    },
    {
      key: 'sale-payouts',
      label: 'Sale payouts',
      description: 'Where money from properties you sell is paid',
      icon: Landmark,
      onPress: go('/(app)/seller-payout'),
    },
    ...(inAgency
      ? [
          {
            key: 'agency-share',
            label: 'Agency commission',
            description: 'Your share of your firm’s commissions',
            icon: Wallet,
            onPress: go('/(app)/agency-share'),
          },
        ]
      : []),
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Everything we’ve told you',
      icon: Bell,
      onPress: go('/(app)/realtor-notifications'),
    },
    {
      key: 'notification-settings',
      label: 'Alerts',
      description: 'What buzzes your phone, and what’s emailed',
      icon: BellRing,
      onPress: go('/(app)/realtor-notification-settings'),
    },
    {
      key: 'billing',
      label: 'Plan & billing',
      description: 'What’s included and your receipts',
      icon: Sparkles,
      onPress: go('/(app)/billing'),
    },
    {
      key: 'text-messages',
      label: 'Text messages',
      description: 'SMS or WhatsApp for urgent alerts',
      icon: MessageCircle,
      onPress: go('/(app)/whatsapp-settings'),
    },
    {
      key: 'security',
      label: 'Security',
      description: 'Password, two-factor and app lock',
      icon: KeyRound,
      onPress: go('/(app)/security-settings'),
    },
    {
      key: 'help',
      label: 'Help centre',
      description: 'Answers and support',
      icon: CircleHelp,
      onPress: go('/(app)/help?messages=/(app)/(realtor)/messages'),
    },
  ];

  return (
    <Screen>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={[
          profile?.legalName ?? 'Sureground realtor',
          profile?.email,
          verified ? 'verified' : 'not verified',
        ]
          .filter(Boolean)
          .join(', ')}
        style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg }}
      >
        <Avatar name={profile?.legalName} size={76} />
        <Text variant="heading" style={{ marginTop: spacing.sm }}>
          {profile?.legalName ?? 'Sureground realtor'}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {profile?.email ?? profile?.phone ?? ''}
        </Text>
        <Text
          variant="caption"
          color="primary"
          style={{ fontWeight: '700', marginTop: spacing.xs }}
        >
          Realtor
        </Text>
      </View>

      <WorkspaceSwitcher />

      <SettingsGroup title="Your business" items={business} />
      <SettingsGroup title="Trust & reputation" items={trust} />
      <SettingsGroup
        title="Settings"
        items={settings}
        footer={
          <>
            <Divider />
            <View style={{ padding: spacing.lg, gap: spacing.sm }}>
              <Text variant="bodyStrong">Appearance</Text>
              <ThemeToggle variant="segmented" />
            </View>
          </>
        }
      />

      <Button
        label="Sign out"
        variant="outline"
        icon={<LogOut size={16} color={colors.foreground} />}
        onPress={() =>
          Alert.alert('Sign out of Sureground?', 'You can sign back in any time.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: signOut },
          ])
        }
      />
      <Text variant="caption" color="mutedForeground" center style={{ marginBottom: spacing.lg }}>
        Sureground {Constants.expoConfig?.version ?? ''}
      </Text>
    </Screen>
  );
}
