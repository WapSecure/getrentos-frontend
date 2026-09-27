import { Alert, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Constants from 'expo-constants';
import {
  BarChart3,
  Bell,
  Landmark,
  UserRound,
  CircleHelp,
  FileStack,
  Handshake,
  KeySquare,
  LandPlot,
  Sparkles,
  Trees,
  Gauge,
  KeyRound,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  Wallet,
} from 'lucide-react-native';
import { Avatar, Button, Screen, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';

const go = (href: Href) => () => router.push(href);

export default function OwnerAccount() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();
  const verified = !!profile?.isVerified;

  const selling: SettingsItem[] = [
    {
      key: 'sales',
      label: 'Sales in progress',
      description: 'Where each accepted sale stands',
      icon: Wallet,
      onPress: go('/(app)/owner-transactions'),
    },
    {
      key: 'leads',
      label: 'Buyer leads',
      description: 'People who asked about your listings',
      icon: Users,
      onPress: go('/(app)/owner-leads'),
    },
    {
      key: 'documents',
      label: 'Documents',
      description: 'Transfer papers, shared with buyers',
      icon: FileStack,
      onPress: go('/(app)/owner-documents'),
    },
    {
      key: 'land',
      label: 'Land',
      description: 'Parcels, title and diligence',
      icon: LandPlot,
      onPress: go('/(app)/owner-land'),
    },
    {
      key: 'team',
      label: 'Realtors & agents',
      description: 'Approve who represents you and where',
      icon: Handshake,
      onPress: go('/(app)/representatives'),
    },
    {
      key: 'estates',
      label: 'Estate requests',
      description: 'Estates asking to market your property',
      icon: Trees,
      onPress: go('/(app)/estate-agreements'),
    },
    {
      key: 'managed',
      label: 'Properties I manage',
      description: 'Authority over other owners’ property',
      icon: KeySquare,
      onPress: go('/(app)/managed-properties'),
    },
    {
      key: 'analytics',
      label: 'Analytics',
      description: 'Value, growth and return per property',
      icon: BarChart3,
      onPress: go('/(app)/owner-analytics'),
    },
  ];

  const trust: SettingsItem[] = [
    {
      key: 'trust',
      label: 'Trust profile',
      description: 'Your score and what buyers see',
      icon: Gauge,
      value: profile ? String(profile.trustScore) : undefined,
      onPress: go('/(app)/owner-trust-profile'),
    },
    {
      key: 'identity',
      label: 'Identity verification',
      icon: ShieldCheck,
      value: verified ? 'Verified' : 'Not verified',
      tone: verified ? 'success' : 'warning',
      onPress: go('/(app)/verify-identity'),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      description: 'What buyers say about you',
      icon: Star,
      onPress: go('/(app)/owner-reviews'),
    },
  ];

  const settings: SettingsItem[] = [
    {
      key: 'profile',
      label: 'Profile',
      description: 'Name, company and phone',
      icon: UserRound,
      onPress: go('/(app)/owner-profile'),
    },
    {
      key: 'payout',
      label: 'Payout account',
      description: 'Where sale proceeds are paid',
      icon: Landmark,
      onPress: go('/(app)/seller-payout'),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Offers, payments and verification alerts',
      icon: Bell,
      onPress: go('/(app)/owner-notification-settings'),
    },
    {
      key: 'preferences',
      label: 'Selling preferences',
      description: 'Minimum offers and auto-decline',
      icon: SlidersHorizontal,
      onPress: go('/(app)/owner-settings'),
    },
    {
      key: 'billing',
      label: 'Plan & billing',
      description: 'What’s included and your receipts',
      icon: Sparkles,
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
      onPress: go('/(app)/help?messages=/(app)/(owner)/messages'),
    },
  ];

  return (
    <Screen>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={[
          profile?.legalName ?? 'GetRentos owner',
          profile?.email,
          verified ? 'verified' : 'not verified',
        ]
          .filter(Boolean)
          .join(', ')}
        style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg }}
      >
        <Avatar name={profile?.legalName} size={76} />
        <Text variant="heading" style={{ marginTop: spacing.sm }}>
          {profile?.legalName ?? 'GetRentos owner'}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {profile?.email ?? profile?.phone ?? ''}
        </Text>
        <Text
          variant="caption"
          color="primary"
          style={{ fontWeight: '700', marginTop: spacing.xs }}
        >
          Property owner
        </Text>
      </View>

      <SettingsGroup title="Selling" items={selling} />
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
