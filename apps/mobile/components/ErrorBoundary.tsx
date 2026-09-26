import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import Constants from 'expo-constants';
import type { ErrorBoundaryProps } from 'expo-router';
import { getPalette } from '@getrentos/tokens';
import { report } from '@/lib/analytics';

/**
 * Branded fallback for uncaught render errors, wired via expo-router's
 * `ErrorBoundary` export in the root layout. Deliberately self-contained — no
 * theme/provider hooks — so it still renders when the failure is high in the
 * tree. In dev it shows the message; in production it stays generic.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const isDev = Constants.executionEnvironment !== 'standalone' && __DEV__;
  const colors = getPalette(useColorScheme() === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    report(error, { boundary: 'root' });
  }, [error]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Something went wrong</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        {isDev ? error.message : 'An unexpected error occurred. Please try again.'}
      </Text>
      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Try loading GetRentos again"
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emoji: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  button: {
    marginTop: 12,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
});
