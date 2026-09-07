import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { haptics } from '@/lib/haptics';
import { Button, Screen, Text, TextField, useTheme } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function TwoFactorScreen() {
  const { pendingTwoFactor, completeTwoFactor, cancelTwoFactor } = useAuth();
  const { spacing } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!pendingTwoFactor) {
    router.replace('/(auth)/sign-in');
    return null;
  }

  const submit = async () => {
    if (code.length !== 6) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeTwoFactor(code);
      await haptics.success();
    } catch (err) {
      await haptics.error();
      setCode('');
      setError(err instanceof ApiError ? err.message : 'That code didn’t work. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing['4xl'], marginBottom: spacing.xl }}>
        <Text variant="label" color="primary" uppercase>
          Two-factor authentication
        </Text>
        <Text variant="title">Enter your code</Text>
        <Text variant="body" color="mutedForeground">
          Open your authenticator app and enter the 6-digit code for GetRentos.
        </Text>
      </View>

      <TextField
        label="Authentication code"
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        onSubmitEditing={submit}
        error={error}
      />

      <Button
        label="Verify & sign in"
        fullWidth
        disabled={code.length !== 6}
        loading={submitting}
        onPress={submit}
        style={{ marginTop: spacing.md }}
      />
      <Button
        label="Back to sign in"
        variant="ghost"
        fullWidth
        onPress={() => {
          cancelTwoFactor();
          router.replace('/(auth)/sign-in');
        }}
      />
    </Screen>
  );
}
