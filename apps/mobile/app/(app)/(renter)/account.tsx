import { Alert, Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Constants from 'expo-constants';
import {
  BedDouble,
  Bell,
  Calendar,
  CheckSquare,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  FileStack,
  FileText,
  Gift,
  LandPlot,
  LifeBuoy,
  Lock,
  LogOut,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldEllipsis,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react-native';
import { Avatar, Button, Card, Screen, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';

const go = (href: Href) => () => router.push(href);

export default function Account() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();
  const verified = !!profile?.isVerified;

  const confirmSignOut = () =>
    Alert.alert('Sign out of GetRentos?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  const home: SettingsItem[] = [
    {
      key: 'lease',
      label: 'Lease & payments',
      description: 'View your lease, pay rent, get receipts',
      icon: FileText,
      onPress: go('/(app)/lease'),
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      description: 'Report an issue, track repairs',
      icon: Wrench,
      onPress: go('/(app)/renter-maintenance'),
    },
    {
      key: 'checklist',
      label: 'Move checklist',
      description: 'Move-in and move-out to-dos',
      icon: CheckSquare,
      onPress: go('/(app)/move-checklist'),
    },
    {
      key: 'inspections',
      label: 'Inspection reports',
      description: 'Move-in, move-out and periodic reports',
      icon: ClipboardCheck,
      onPress: go('/(app)/inspections'),
    },
    {
      key: 'documents',
      label: 'Documents',
      description: 'Leases, receipts and paperwork',
      icon: FileStack,
      onPress: go('/(app)/documents'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      description: 'Viewings, payments and lease dates',
      icon: Calendar,
      onPress: go('/(app)/calendar'),
    },
  ];

  const money: SettingsItem[] = [
    {
      key: 'methods',
      label: 'Payment methods',
      description: 'Cards and accounts for rent',
      icon: CreditCard,
      onPress: go('/(app)/payment-methods'),
    },
    {
      key: 'flex',
      label: 'GetRentos Flex',
      description: 'Split yearly rent into monthly payments',
      icon: Wallet,
      onPress: go('/(app)/financing'),
    },
    {
      key: 'credit',
      label: 'Credit reporting',
      description: 'Turn on-time rent into credit history',
      icon: TrendingUp,
      onPress: go('/(app)/credit-reporting'),
    },
    {
      key: 'roommates',
      label: 'Roommates',
      description: 'Split rent and shared expenses',
      icon: Users,
      onPress: go('/(app)/roommates'),
    },
  ];

  const trust: SettingsItem[] = [
    {
      key: 'identity',
      label: 'Identity verification',
      icon: ShieldCheck,
      value: verified ? 'Verified' : 'Not verified',
      tone: verified ? 'success' : 'warning',
      onPress: go('/(app)/verify-identity'),
    },
    {
      key: 'trust',
      label: 'Trust score',
      description: 'How landlords see you',
      icon: Sparkles,
      value: profile?.trustScore != null ? `${profile.trustScore} / 100` : undefined,
      onPress: go('/(app)/trust-score'),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      description: 'Rate past homes, see yours',
      icon: Star,
      onPress: go('/(app)/reviews'),
    },
  ];

  const explore: SettingsItem[] = [
    {
      key: 'shortlets',
      label: 'Shortlet stays',
      description: 'Book short stays and manage trips',
      icon: BedDouble,
      onPress: go('/(app)/shortlets'),
    },
    {
      key: 'land',
      label: 'Land',
      description: 'Browse verified land parcels',
      icon: LandPlot,
      onPress: go('/(app)/land'),
    },
    {
      key: 'referrals',
      label: 'Referrals',
      description: 'Invite friends, earn rewards',
      icon: Gift,
      onPress: go('/(app)/referrals'),
    },
  ];

  const settings: SettingsItem[] = [
    {
      key: 'profile',
      label: 'Edit profile',
      description: 'Name, contact details, photo',
      icon: UserRound,
      onPress: go('/(app)/edit-profile'),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Email, push and in-app',
      icon: Bell,
      onPress: go('/(app)/notification-settings'),
    },
    {
      key: 'security',
      label: 'Security',
      description: 'Password, phone verification, 2FA',
      icon: ShieldEllipsis,
      onPress: go('/(app)/security-settings'),
    },
    {
      key: 'privacy',
      label: 'Privacy',
      description: 'Who sees your profile and activity',
      icon: Lock,
      onPress: go('/(app)/privacy-settings'),
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp updates',
      description: 'Rent alerts without the app',
      icon: MessageCircle,
      onPress: go('/(app)/whatsapp-settings'),
    },
    {
      key: 'ussd',
      label: 'Dial-in access',
      description: 'Use GetRentos with no data',
      icon: Smartphone,
      onPress: go('/(app)/ussd'),
    },
  ];

  const help: SettingsItem[] = [
    {
      key: 'help',
      label: 'Help centre',
      description: 'Answers to common questions',
      icon: CircleHelp,
      onPress: go('/(app)/help?messages=/(app)/(renter)/messages'),
    },
    {
      key: 'support',
      label: 'Contact support',
      description: 'Talk to our team',
      icon: LifeBuoy,
      onPress: go('/(app)/support'),
    },
  ];

  return (
    <Screen>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={[
          profile?.legalName ?? 'GetRentos user',
          profile?.email ?? profile?.phone,
          verified ? 'verified account' : 'not verified',
        ]
          .filter(Boolean)
          .join(', ')}
        style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg }}
      >
        <Avatar name={profile?.legalName} size={76} />
        <Text variant="heading" style={{ marginTop: spacing.sm }}>
          {profile?.legalName ?? 'GetRentos user'}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {profile?.email ?? profile?.phone ?? ''}
        </Text>
        {verified ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs }}
          >
            <ShieldCheck size={14} color={colors.success} />
            <Text variant="caption" style={{ color: colors.success, fontWeight: '700' }}>
              Verified renter
            </Text>
          </View>
        ) : null}
      </View>

      {!verified ? (
        <Pressable
          onPress={go('/(app)/verify-identity')}
          accessibilityRole="button"
          accessibilityLabel="Verify your identity. Unlocks applications and offers. Takes about two minutes."
        >
          <Card
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.warningSubtle,
              borderColor: colors.warning,
            }}
          >
            <ShieldAlert size={22} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Verify your identity</Text>
              <Text variant="caption" color="mutedForeground">
                Unlocks applications and offers — about two minutes
              </Text>
            </View>
            <ChevronRight size={18} color={colors.warning} />
          </Card>
        </Pressable>
      ) : null}

      <SettingsGroup title="Your home" items={home} />
      <SettingsGroup title="Money" items={money} />
      <SettingsGroup title="Trust & reputation" items={trust} />
      <SettingsGroup title="Explore" items={explore} />
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
      <SettingsGroup title="Help" items={help} />

      <Button
        label="Sign out"
        variant="outline"
        icon={<LogOut size={16} color={colors.foreground} />}
        onPress={confirmSignOut}
      />
      <Text variant="caption" color="mutedForeground" center style={{ marginBottom: spacing.lg }}>
        GetRentos {Constants.expoConfig?.version ?? ''}
      </Text>
    </Screen>
  );
}
