import { Alert, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Constants from 'expo-constants';
import {
  CircleHelp,
  KeyRound,
  LogOut,
  Megaphone,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Vote,
  WalletCards,
  Waves,
} from 'lucide-react-native';
import { Avatar, Button, Screen, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { useEstate } from '@/hooks/useEstate';
import { useAuth } from '@/lib/auth/AuthProvider';

const go = (href: Href) => () => router.push(href);

export default function EstateAccount() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();
  const { estate } = useEstate();
  const verified = !!profile?.isVerified;

  const office: SettingsItem[] = [
    {
      key: 'announcements',
      label: 'Announcements',
      description: 'What you’ve told your residents',
      icon: Megaphone,
      onPress: go('/(app)/estate-announcements'),
    },
    {
      key: 'polls',
      label: 'Polls',
      description: 'Put a decision to the estate',
      icon: Vote,
      onPress: go('/(app)/estate-polls'),
    },
    {
      key: 'amenities',
      label: 'Amenities',
      description: 'Shared spaces and their bookings',
      icon: Waves,
      onPress: go('/(app)/estate-amenities'),
    },
    {
      key: 'charge',
      label: 'Charge dues',
      description: 'A service charge or levy, to all or some homes',
      icon: WalletCards,
      onPress: go('/(app)/estate-charge'),
    },
    {
      key: 'late-fees',
      label: 'Late fee rules',
      description: estate
        ? estate.lateFeeAmount
          ? `₦${estate.lateFeeAmount.toLocaleString('en-NG')} after ${estate.graceDays} day${estate.graceDays === 1 ? '' : 's'}`
          : 'No late fee set'
        : undefined,
      icon: SlidersHorizontal,
      onPress: () => router.push({ pathname: '/(app)/(estate)/dues', params: { settings: '1' } }),
    },
  ];

  const settings: SettingsItem[] = [
    {
      key: 'identity',
      label: 'Identity verification',
      icon: ShieldCheck,
      value: verified ? 'Verified' : 'Not verified',
      tone: verified ? 'success' : 'warning',
      onPress: go('/(app)/verify-identity'),
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
      onPress: go('/(app)/help'),
    },
  ];

  return (
    <Screen>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={[
          profile?.legalName ?? 'Estate manager',
          profile?.email,
          estate ? `managing ${estate.name}` : null,
        ]
          .filter(Boolean)
          .join(', ')}
        style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg }}
      >
        <Avatar name={profile?.legalName} size={76} />
        <Text variant="heading" style={{ marginTop: spacing.sm }}>
          {profile?.legalName ?? 'Estate manager'}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {profile?.email ?? profile?.phone ?? ''}
        </Text>
        <Text
          variant="caption"
          color="primary"
          style={{ fontWeight: '700', marginTop: spacing.xs }}
        >
          Estate manager{estate ? ` · ${estate.name}` : ''}
        </Text>
      </View>

      <WorkspaceSwitcher />

      <SettingsGroup title="The office" items={office} />
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
      <Text variant="caption" color="mutedForeground" center>
        Gates, staff, patrols, statements and your microsite are set up on the GetRentos website.
      </Text>

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
