import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/lib/auth';

/**
 * Sign-in screen for the mobile app. Uses the same /auth/login endpoint as the
 * web app; the returned access token is stored in the OS secure store.
 */
export default function SignInScreen() {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!identifier || !password) {
      setError('Enter your email/phone and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(identifier.trim(), password);
      // Success — the root layout flips to the (tabs) group automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>GetRentos</Text>
        <Text style={styles.tagline}>The trust-driven property operating system.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email or phone"
          placeholderTextColor="#98989d"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={identifier}
          onChangeText={setIdentifier}
          accessibilityLabel="Email or phone"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#98989d"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleSignIn}
          disabled={isSubmitting}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1d1d1f',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    color: '#6e6e73',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1d1d1f',
    marginBottom: 12,
  },
  error: {
    color: '#d70015',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#0071E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
