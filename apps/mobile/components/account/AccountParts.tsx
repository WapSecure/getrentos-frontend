import { Alert, View } from 'react-native';
import Constants from 'expo-constants';
import { LogOut, ShieldCheck } from '@sureground/icons/native';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Text,
  ThemeToggle,
  useTheme,
  withAlpha,
} from '@sureground/ui-native';
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

/**
 * The account tab's identity card: avatar, name, contact, a blue role chip and, once identity is
 * checked, the blue verified mark. Read as one header by screen readers.
 */
export function ProfileCard({
  role,
  fallbackName,
  note,
  verifiedLabel = 'Identity verified',
}: {
  role: string;
  fallbackName: string;
  note?: string;
  verifiedLabel?: string;
}) {
  const { profile } = useAuth();
  const { verified } = useIdentityVerification();
  const { colors, spacing, radius } = useTheme();
  const name = profile?.legalName ?? fallbackName;
  const contact = profile?.email ?? profile?.phone ?? '';
  const chip = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.full,
    backgroundColor: withAlpha(colors.primary, 0.12),
  };
  return (
    <Card
      elevated
      accessible
      accessibilityRole="header"
      accessibilityLabel={[
        name,
        contact,
        role,
        verified ? 'identity verified' : 'identity not verified',
        note,
      ]
        .filter(Boolean)
        .join(', ')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        marginTop: spacing.sm,
        borderTopWidth: 3,
        borderTopColor: colors.primary,
      }}
    >
      <View
        style={{
          padding: 3,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: verified ? colors.primary : colors.border,
        }}
      >
        <Avatar name={profile?.legalName} size={60} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="heading" numberOfLines={2}>
          {name}
        </Text>
        {contact ? (
          <Text variant="callout" color="mutedForeground" numberOfLines={1}>
            {contact}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 }}>
          <View style={chip}>
            <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
              {role}
            </Text>
          </View>
          {verified ? (
            <View style={chip}>
              <ShieldCheck size={12} color={colors.primary} />
              <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
                {verifiedLabel}
              </Text>
            </View>
          ) : null}
        </View>
        {note ? (
          <Text variant="caption" color="mutedForeground">
            {note}
          </Text>
        ) : null}
      </View>
    </Card>
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
