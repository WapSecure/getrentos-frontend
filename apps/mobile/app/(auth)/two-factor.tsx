import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ShieldCheck } from 'lucide-react-native';
import { AuthScaffold, Button, OtpInput, Text, useTheme } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { haptics } from '@/lib/haptics';

export default function TwoFactor() {
  const { pendingTwoFactor, completeTwoFactor, cancelTwoFactor } = useAuth();
  const { colors, spacing } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!pendingTwoFactor) {
    router.replace('/(auth)/sign-in');
    return null;
  }

  const submit = async (value = code) => {
    if (value.length !== 6 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeTwoFactor(value);
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
    <AuthScaffold
      kicker="Two-factor authentication"
      title="Enter your code"
      subtitle="Open your authenticator app and enter the 6-digit code for GetRentos."
      onBack={() => {
        cancelTwoFactor();
        router.replace('/(auth)/sign-in');
      }}
      footer={
        <Button
          label="Verify & sign in"
          disabled={code.length !== 6}
          loading={submitting}
          onPress={() => submit()}
        />
      }
    >
      <View style={{ gap: spacing['2xl'], alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={26} color={colors.primary} />
        </View>

        <View style={{ alignSelf: 'stretch' }}>
          <OtpInput value={code} onChange={setCode} onComplete={submit} autoFocus />
        </View>

        {error ? (
          <Animated.View entering={FadeIn.duration(160)}>
            <Text variant="callout" color="destructive" center>
              {error}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </AuthScaffold>
  );
}
