import { Alert, View } from 'react-native';
import Constants from 'expo-constants';
import { LogOut } from '@sureground/icons/native';
import { Avatar, Button, Divider, Text, ThemeToggle, useTheme } from '@sureground/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';

export function AccountHeader({
  role,
  fallbackName,
  note,
}: {
  role: string;
  fallbackName: string;
  note?: string;
}) {
  const { profile } = useAuth();
  const { verified } = useIdentityVerification();
  const { spacing } = useTheme();
  const name = profile?.legalName ?? fallbackName;
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={[
        name,
        profile?.email,
        role,
        verified ? 'identity verified' : 'identity not verified',
        note,
      ]
        .filter(Boolean)
        .join(', ')}
      style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg }}
    >
      <Avatar name={profile?.legalName} size={76} />
      <Text variant="heading" style={{ marginTop: spacing.sm }}>
        {name}
      </Text>
      <Text variant="callout" color="mutedForeground">
        {profile?.email ?? profile?.phone ?? ''}
      </Text>
      <Text variant="caption" color="primary" style={{ fontWeight: '700', marginTop: spacing.xs }}>
        {role}
      </Text>
      {note ? (
        <Text variant="caption" color="mutedForeground">
          {note}
        </Text>
      ) : null}
    </View>
  );
}

export function AppearanceFooter() {
  const { spacing } = useTheme();
  return (
    <>
      <Divider />
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text variant="bodyStrong">Appearance</Text>
        <ThemeToggle variant="segmented" />
      </View>
    </>
  );
}

export function AccountFooter() {
  const { signOut } = useAuth();
  const { colors, spacing } = useTheme();
  return (
    <>
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
    </>
  );
}
