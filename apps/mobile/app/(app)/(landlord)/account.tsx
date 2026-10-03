import { Alert, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Constants from 'expo-constants';
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  BedDouble,
  CircleHelp,
  ClipboardCheck,
  FileSignature,
  FileStack,
  FileText,
  Gavel,
  Gift,
  Globe,
  Handshake,
  HardHat,
  KeyRound,
  LogOut,
  Megaphone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  Wrench,
} from 'lucide-react-native';
import { Avatar, Button, Screen, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';

const go = (href: Href) => () => router.push(href);

export default function LandlordAccount() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();
  const verified = !!profile?.isVerified;

  const renting: SettingsItem[] = [
    {
      key: 'applications',
      label: 'Applications',
      description: 'Review and decide on applicants',
      icon: FileText,
      onPress: go('/(app)/landlord-applications'),
    },
    {
      key: 'leases',
      label: 'Leases',
      description: 'Drafts, signatures and renewals',
      icon: FileSignature,
      onPress: go('/(app)/landlord-leases'),
    },
    {
      key: 'payments',
      label: 'Rent payments',
      description: 'Rent collected, payouts and arrears',
      icon: Banknote,
      onPress: go('/(app)/landlord-payments'),
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      description: 'Open issues across your properties',
      icon: Wrench,
      onPress: go('/(app)/landlord-maintenance'),
    },
    {
      key: 'listings',
      label: 'Listings',
      description: 'What is live, paused or draft',
      icon: Megaphone,
      onPress: go('/(app)/landlord-listings'),
    },
    {
      key: 'leads',
      label: 'Leads',
      description: 'Enquiries to follow up',
      icon: Users,
      onPress: go('/(app)/landlord-leads'),
    },
    {
      key: 'evictions',
      label: 'Evictions',
      description: 'Notice, filing and resolution',
      icon: Gavel,
      onPress: go('/(app)/landlord-evictions'),
    },
  ];

  const business: SettingsItem[] = [
    {
      key: 'financials',
      label: 'Financials',
      description: 'Profit, expenses and owner statements',
      icon: BarChart3,
      onPress: go('/(app)/landlord-financials'),
    },
    {
      key: 'documents',
      label: 'Documents',
      description: 'Leases, ownership papers, reports',
      icon: FileStack,
      onPress: go('/(app)/landlord-documents'),
    },
    {
      key: 'home-care',
      label: 'Home care',
      description: 'Work orders, assets and servicing',
      icon: ClipboardCheck,
      onPress: go('/(app)/home-care'),
    },
    {
      key: 'vendors',
      label: 'Vendors',
      description: 'Tradespeople you assign to repairs',
      icon: HardHat,
      onPress: go('/(app)/landlord-vendors'),
    },
    {
      key: 'host',
      label: 'Short-stay hosting',
      description: 'Nightly stays, bookings and payouts',
      icon: BedDouble,
      onPress: go('/(app)/host'),
    },
    {
      key: 'microsite',
      label: 'Microsite',
      description: 'Your public page and its address',
      icon: Globe,
      onPress: go('/(app)/landlord-microsite'),
    },
    {
      key: 'team',
      label: 'Realtors & agents',
      description: 'Approve who represents you and where',
      icon: Handshake,
      onPress: go('/(app)/representatives'),
    },
    {
      key: 'stays',
      label: 'Browse short stays',
      description: 'Find a stay as a guest',
      icon: Search,
      onPress: go('/(app)/shortlets'),
    },
    {
      key: 'referrals',
      label: 'Referrals',
      description: 'Invite others, earn rewards',
      icon: Gift,
      onPress: go('/(app)/referrals'),
    },
  ];

  const trust: SettingsItem[] = [
    {
      key: 'identity',
      label: 'Identity verification',
      description: verified ? undefined : 'Required to publish listings',
      icon: ShieldCheck,
      value: verified ? 'Verified' : 'Not verified',
      tone: verified ? 'success' : 'warning',
      onPress: go('/(app)/verify-identity'),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      description: 'What tenants say about you',
      icon: Star,
      onPress: go('/(app)/landlord-reviews'),
    },
  ];

  const settings: SettingsItem[] = [
    {
      key: 'settings',
      label: 'Profile & preferences',
      description: 'Profile, payout, automation and alerts',
      icon: SlidersHorizontal,
      onPress: go('/(app)/landlord-settings'),
    },
    {
      key: 'billing',
      label: 'Plan & billing',
      description: 'What’s included and your receipts',
      icon: BadgeCheck,
      onPress: go('/(app)/billing'),
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
      onPress: go('/(app)/help?messages=/(app)/(landlord)/messages'),
    },
  ];

  return (
    <Screen>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={[
          profile?.legalName ?? 'GetRentos landlord',
          profile?.email,
          verified ? 'verified' : 'not verified',
        ]
          .filter(Boolean)
          .join(', ')}
        style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg }}
      >
        <Avatar name={profile?.legalName} size={76} />
        <Text variant="heading" style={{ marginTop: spacing.sm }}>
          {profile?.legalName ?? 'GetRentos landlord'}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {profile?.email ?? profile?.phone ?? ''}
        </Text>
        <Text
          variant="caption"
          color="primary"
          style={{ fontWeight: '700', marginTop: spacing.xs }}
        >
          Landlord
        </Text>
      </View>

      <WorkspaceSwitcher />

      <SettingsGroup title="Renting" items={renting} />
      <SettingsGroup title="Portfolio & growth" items={business} />
      <SettingsGroup title="Trust & reputation" items={trust} />
      <SettingsGroup
        title="Settings"
        items={settings}
        footer={
          <View
            style={{
              padding: spacing.lg,
              gap: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text variant="bodyStrong">Appearance</Text>
            <ThemeToggle variant="segmented" />
          </View>
        }
      />

      <Button
        label="Sign out"
        variant="outline"
        icon={<LogOut size={16} color={colors.foreground} />}
        onPress={() =>
          Alert.alert('Sign out of GetRentos?', 'You can sign back in any time.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: signOut },
          ])
        }
      />
      <Text variant="caption" color="mutedForeground" center style={{ marginBottom: spacing.lg }}>
        GetRentos {Constants.expoConfig?.version ?? ''}
      </Text>
    </Screen>
  );
}
