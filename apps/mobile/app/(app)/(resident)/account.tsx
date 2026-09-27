import { View } from 'react-native';
import { router } from 'expo-router';
import { LogOut, KeyRound, ShieldCheck } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Screen,
  Text,
  ThemeToggle,
  useTheme,
} from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SettingsGroup } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';

export default function ResidentAccount() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl }}>
        <Avatar name={profile?.legalName} size={72} />
        <Text variant="heading">{profile?.legalName ?? 'GetRentos user'}</Text>
        <Text variant="callout" color="mutedForeground">
          {profile?.email ?? profile?.phone ?? ''}
        </Text>
        {profile?.isVerified ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={14} color={colors.success} />
            <Text variant="caption" style={{ color: colors.success }}>
              Verified account
            </Text>
          </View>
        ) : null}
      </View>

      <WorkspaceSwitcher />

      <SettingsGroup
        title="Account"
        items={[
          {
            key: 'security',
            label: 'Security',
            description: 'Password, two-factor and app lock',
            icon: KeyRound,
            onPress: () => router.push('/(app)/security-settings'),
          },
        ]}
      />

      <Card elevated padding="none">
        <View style={{ padding: spacing.lg, gap: spacing.xs }}>
          <Text variant="bodyStrong">Appearance</Text>
          <Text variant="caption" color="mutedForeground">
            Choose how GetRentos looks on this device.
          </Text>
        </View>
        <Divider />
        <View style={{ padding: spacing.md }}>
          <ThemeToggle variant="segmented" />
        </View>
      </Card>

      <Button
        label="Sign out"
        variant="outline"
        fullWidth
        icon={<LogOut size={16} color={colors.foreground} />}
        onPress={signOut}
      />
    </Screen>
  );
}
