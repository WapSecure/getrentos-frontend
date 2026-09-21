import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, LogOut, ShieldCheck } from 'lucide-react-native';
import { Avatar, Card, Divider, Screen, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function LandlordAccount() {
  const { colors, spacing } = useTheme();
  const { profile, signOut } = useAuth();

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to manage your properties.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <Screen>
      <Text variant="title">Account</Text>

      <Card padding={spacing.lg}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={profile?.legalName ?? 'Landlord'} size={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                {profile?.legalName ?? 'Landlord'}
              </Text>
              {profile?.isVerified ? <ShieldCheck size={14} color={colors.success} /> : null}
            </View>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {profile?.email}
            </Text>
          </View>
        </View>
      </Card>

      <Card padding="none">
        <AccountRow
          label="Notifications"
          description="Email, push and in-app preferences"
          onPress={() => router.push('/(app)/notification-settings')}
        />
        <Divider />
        <AccountRow
          label="Security"
          description="Password, phone verification, 2FA"
          onPress={() => router.push('/(app)/security-settings')}
        />
        <Divider />
        <AccountRow
          label="Help"
          description="FAQs and contact options"
          onPress={() => router.push('/(app)/help')}
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color="mutedForeground" uppercase>
          Appearance
        </Text>
        <Card padding={spacing.lg}>
          <ThemeToggle />
        </Card>
      </View>

      <Pressable
        onPress={confirmSignOut}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.lg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <LogOut size={17} color={colors.destructive} />
        <Text variant="callout" color="destructive" style={{ fontWeight: '600' }}>
          Sign out
        </Text>
      </Pressable>
    </Screen>
  );
}

function AccountRow({
  label,
  description,
  onPress,
}: {
  label: string;
  description: string;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {description}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
