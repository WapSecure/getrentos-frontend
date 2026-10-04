import { Alert, View } from 'react-native';
import Constants from 'expo-constants';
import { LogOut } from 'lucide-react-native';
import { Avatar, Button, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * The top and bottom of every portal's Account tab, so they read the same
 * whoever is signed in: who you are and in which role, then — after the
 * portal's own groups — appearance, sign out and the app version.
 */

/** Who is signed in, and as what. */
export function AccountHeader({
  role,
  fallbackName,
  note,
}: {
  /** The role this workspace is for, e.g. "Landlord". */
  role: string;
  /** Shown until the profile has a name. */
  fallbackName: string;
  /** One quiet line under the role, e.g. a rating or a count. */
  note?: string;
}) {
  const { profile } = useAuth();
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
        profile?.isVerified ? 'verified' : 'not verified',
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

/** Light / dark / auto, as the last row of the Settings group. */
export function AppearanceFooter() {
  const { colors, spacing } = useTheme();
  return (
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
  );
}

/** Sign out (after a confirmation) and the app version. */
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
          Alert.alert('Sign out of GetRentos?', 'You can sign back in any time.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: signOut },
          ])
        }
      />
      <Text variant="caption" color="mutedForeground" center style={{ marginBottom: spacing.lg }}>
        GetRentos {Constants.expoConfig?.version ?? ''}
      </Text>
    </>
  );
}
