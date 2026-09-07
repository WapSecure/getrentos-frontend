import { View } from 'react-native';
import { Moon, Sun, SunMoon, LogOut, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Screen,
  Text,
  useTheme,
  type ThemePreference,
} from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';

const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { value: 'system', label: 'System', Icon: SunMoon },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export default function Account() {
  const { profile, signOut } = useAuth();
  const { colors, spacing, radius, preference, setPreference } = useTheme();

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
              Verified account · Trust score {profile.trustScore}
            </Text>
          </View>
        ) : null}
      </View>

      <Card elevated padding="none">
        <View style={{ padding: spacing.lg, gap: spacing.xs }}>
          <Text variant="bodyStrong">Appearance</Text>
          <Text variant="caption" color="mutedForeground">
            Choose how GetRentos looks on this device.
          </Text>
        </View>
        <Divider />
        <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.sm }}>
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const active = preference === value;
            return (
              <View
                key={value}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.accent : 'transparent',
                }}
                onTouchEnd={() => setPreference(value)}
              >
                <Icon size={18} color={active ? colors.primary : colors.mutedForeground} />
                <Text variant="caption" style={{ color: active ? colors.primary : colors.foreground }}>
                  {label}
                </Text>
              </View>
            );
          })}
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
