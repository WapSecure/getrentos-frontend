import { Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import type { ErrorBoundaryProps } from 'expo-router';

/**
 * Branded fallback for uncaught render errors, wired via expo-router's
 * `ErrorBoundary` export in the root layout. Deliberately self-contained — no
 * theme/provider hooks — so it still renders when the failure is high in the
 * tree. In dev it shows the message; in production it stays generic.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const isDev = Constants.executionEnvironment !== 'standalone' && __DEV__;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>
        {isDev ? error.message : 'An unexpected error occurred. Please try again.'}
      </Text>
      <Pressable style={styles.button} onPress={retry} accessibilityRole="button">
        <Text style={styles.buttonText}>Try again</Text>
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
    backgroundColor: '#f6f7f9',
  },
  emoji: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#161b22', textAlign: 'center' },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#667085',
    textAlign: 'center',
    maxWidth: 320,
  },
  button: {
    marginTop: 12,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#0071e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
