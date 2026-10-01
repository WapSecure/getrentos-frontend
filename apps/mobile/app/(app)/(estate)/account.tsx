import { View } from 'react-native';
import { Button, Screen, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function EstateAccount() {
  const { profile, signOut } = useAuth();
  const { spacing } = useTheme();
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Text variant="title">{profile?.legalName ?? 'Estate manager'}</Text>
        <Text variant="body" color="mutedForeground">
          Estate management account
        </Text>
      </View>
      <WorkspaceSwitcher />
      <ThemeToggle />
      <Button label="Sign out" variant="outline" onPress={signOut} />
    </Screen>
  );
}
