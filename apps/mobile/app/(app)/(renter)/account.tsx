import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, LogOut, ShieldCheck } from 'lucide-react-native';
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

export default function Account() {
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
              Verified account · Trust score {profile.trustScore}
            </Text>
          </View>
        ) : null}
      </View>

      <Card elevated padding="none">
        <Pressable
          onPress={() => router.push('/(app)/verify-identity')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <ShieldCheck size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Identity verification</Text>
            <Text variant="caption" color="mutedForeground">
              {profile?.isVerified ? 'Verified' : 'Required for applications and offers'}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
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
