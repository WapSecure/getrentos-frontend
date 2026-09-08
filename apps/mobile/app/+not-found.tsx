import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Compass } from 'lucide-react-native';
import { Screen, Text, useTheme } from '@getrentos/ui-native';

export default function NotFound() {
  const { colors, spacing } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing['6xl'] }}>
          <Compass size={40} color={colors.mutedForeground} />
          <Text variant="title" center>
            This page doesn’t exist
          </Text>
          <Link href="/" style={{ marginTop: spacing.md }}>
            <Text variant="bodyStrong" color="primary">
              Go home
            </Text>
          </Link>
        </View>
      </Screen>
    </>
  );
}
