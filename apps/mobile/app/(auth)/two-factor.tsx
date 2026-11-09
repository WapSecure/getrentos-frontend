import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import {
  AuthScaffold,
  Button,
  FormAlert,
  LinkButton,
  OtpInput,
  TextField,
  useTheme,
} from '@sureground/ui-native';
import { cleanSecondFactorInput, isSecondFactorCode } from '@sureground/shared';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { haptics } from '@/lib/haptics';

export default function TwoFactor() {
  const { pendingTwoFactor, completeTwoFactor, cancelTwoFactor } = useAuth();
  const { colors, spacing } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Without the phone, a one-time backup code stands in.
  const [useBackupCode, setUseBackupCode] = useState(false);

  useEffect(() => {
    if (!pendingTwoFactor) router.replace('/(auth)/sign-in');
  }, [pendingTwoFactor]);

  if (!pendingTwoFactor) return null;

  const submit = async (value = code) => {
    if (!isSecondFactorCode(value) || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeTwoFactor(value);
      await haptics.success();
    } catch (err) {
      await haptics.error();
      setCode('');
      setError(errorMessage(err, 'That code didn’t work. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      kicker="Two-factor authentication"
      title="Enter your code"
      subtitle={
        useBackupCode
          ? 'Enter one of the backup codes you saved when you turned on two-factor. Each works once.'
          : 'Open your authenticator app and enter the 6-digit code for Sureground.'
      }
      onBack={() => {
        cancelTwoFactor();
        router.replace('/(auth)/sign-in');
      }}
      footer={
        <Button
          label="Verify & sign in"
          disabled={!isSecondFactorCode(code)}
          loading={submitting}
          onPress={() => submit()}
        />
      }
    >
      <View style={{ gap: spacing['2xl'], alignItems: 'center' }}>
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
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

        <View style={{ alignSelf: 'stretch', gap: spacing.md }}>
          {useBackupCode ? (
            <TextField
              label="Backup code"
              value={code}
              onChangeText={(v) => {
                setCode(cleanSecondFactorInput(v));
                if (error) setError(null);
              }}
              placeholder="abcde-fghij"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              onSubmitEditing={() => submit()}
            />
          ) : (
            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                if (error) setError(null);
              }}
              onComplete={submit}
              invalid={!!error}
              disabled={submitting}
              autoFocus
            />
          )}
          <LinkButton
            label={useBackupCode ? 'Use my authenticator app' : 'Use a backup code instead'}
            onPress={() => {
              setUseBackupCode((on) => !on);
              setCode('');
              setError(null);
            }}
          />
        </View>

        <View style={{ alignSelf: 'stretch' }}>
          <FormAlert message={error} />
        </View>
      </View>
    </AuthScaffold>
  );
}
