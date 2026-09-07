import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';

export default function MagicLinkScreen() {
  const { spacing } = useTheme();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.sendMagicLink(email.trim());
      setSent(true);
      toast.show('Check your inbox for a sign-in link.', 'success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the link. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing['4xl'], marginBottom: spacing.xl }}>
        <Text variant="label" color="primary" uppercase>
          Passwordless
        </Text>
        <Text variant="title">Magic link sign-in</Text>
        <Text variant="body" color="mutedForeground">
          We’ll email you a one-time link. Open it on this device to sign in.
        </Text>
      </View>

      {sent ? (
        <Text variant="body">
          Link sent to <Text variant="bodyStrong">{email.trim()}</Text>. It expires shortly — open it
          from your mail app.
        </Text>
      ) : (
        <TextField
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoFocus
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={submit}
          error={error}
        />
      )}

      {!sent ? (
        <Button
          label="Email me a link"
          fullWidth
          loading={submitting}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
      <Button
        label="Back to sign in"
        variant="ghost"
        fullWidth
        onPress={() => router.replace('/(auth)/sign-in')}
      />
    </Screen>
  );
}
