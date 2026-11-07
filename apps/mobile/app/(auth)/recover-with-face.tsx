import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, ShieldCheck } from 'lucide-react-native';
import {
  AuthScaffold,
  Button,
  FormAlert,
  PasswordField,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { errorMessage } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';
import { haptics } from '@/lib/haptics';
import { formatDate } from '@/lib/format';
import { liveSelfieSupported } from '@/lib/smileid/liveSelfie';
import { FaceCheckButton } from '@/components/trust/FaceCheckButton';
import {
  EMAIL_RE,
  PHONE_RE,
  resetPasswordSchema,
  type ResetPasswordValues,
} from '@/lib/validation';
import { AUTH_CONSTANTS } from '@getrentos/shared';

type Step = 'identify' | 'reset' | 'done';
const STEP_INDEX: Record<Step, number> = { identify: 0, reset: 1, done: 2 };

/**
 * Recover an account with a face check when the email or phone the reset code
 * goes to is lost. The face is matched against the live selfie taken during
 * identity verification (Smile ID); the server decides. Afterwards every
 * device is signed out and payouts pause for 72 hours.
 */
export default function RecoverWithFace() {
  const { colors, spacing } = useTheme();
  const supported = useMemo(() => liveSelfieSupported(), []);
  const [step, setStep] = useState<Step>('identify');
  const [identifier, setIdentifier] = useState('');
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  // Held in memory only: it proves this device started the recovery.
  const [secret, setSecret] = useState<string | null>(null);
  const [heldUntil, setHeldUntil] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const trimmed = identifier.trim();
  const identifierValid = EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed);

  const doReset = handleSubmit(async ({ password }) => {
    if (!recoveryId || !secret) return;
    setBusy(true);
    setError(null);
    try {
      const { payoutsHeldUntil } = await authApi.completeFaceRecovery(recoveryId, secret, password);
      await haptics.success();
      setHeldUntil(payoutsHeldUntil);
      setStep('done');
    } catch (err) {
      setError(errorMessage(err, 'Could not set your new password. Start again.'));
    } finally {
      setBusy(false);
    }
  });

  const stepIndex = STEP_INDEX[step];

  return (
    <AuthScaffold
      kicker="Account recovery"
      title={
        step === 'reset'
          ? 'Set a new password'
          : step === 'done'
            ? 'You’re back in'
            : 'Recover with your face'
      }
      subtitle={
        step === 'identify'
          ? 'Lost access to your email or phone? We’ll match your face to the live selfie from your identity check.'
          : step === 'reset'
            ? 'Face confirmed. Choose a strong password you don’t use anywhere else.'
            : 'Your password is changed and every device was signed out.'
      }
      progress={(stepIndex + 1) / 3}
      progressLabel={`Recovery step ${stepIndex + 1} of 3`}
      onBack={() => router.back()}
      footer={
        step === 'reset' ? (
          <Button label="Update password" loading={busy} onPress={doReset} />
        ) : step === 'done' ? (
          <Button label="Sign in" onPress={() => router.replace('/(auth)/sign-in')} />
        ) : null
      }
    >
      {step === 'identify' ? (
        <View style={{ gap: spacing.xl }}>
          <TextField
            label="Email or phone on your account"
            placeholder="you@example.com or +234 801 234 5678"
            leftIcon={<AtSign size={18} color={colors.mutedForeground} />}
            autoCapitalize="none"
            autoCorrect={false}
            value={identifier}
            onChangeText={(v) => {
              setIdentifier(v);
              if (error) setError(null);
            }}
          />
          {supported ? (
            <FaceCheckButton
              label="Start face check"
              variant="primary"
              start={async () => {
                if (!identifierValid)
                  throw new Error('Enter the email or phone number on your account.');
                const r = await authApi.startFaceRecovery(trimmed);
                setSecret(r.secret);
                setRecoveryId(r.recoveryId);
                return { id: r.recoveryId, session: r.session };
              }}
              status={(id) => authApi.faceRecoveryStatus(id, secret ?? '')}
              onApproved={() => {
                void haptics.success();
                setStep('reset');
              }}
            />
          ) : (
            <FormAlert message="Face recovery works in the GetRentos app on your phone. Open the app to continue, or contact support." />
          )}
          <Text variant="caption" color="mutedForeground">
            Only for accounts that completed the live selfie during identity verification. After
            recovery, payouts pause for 72 hours and we alert your email, in case it wasn’t you.
          </Text>
          <FormAlert message={error} />
        </View>
      ) : step === 'reset' ? (
        <View style={{ gap: spacing.xl }}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                label="New password"
                placeholder={`At least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`}
                showStrength
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                label="Confirm new password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={doReset}
                error={errors.confirmPassword?.message}
              />
            )}
          />
          <FormAlert message={error} />
        </View>
      ) : (
        <View style={{ gap: spacing.md, alignItems: 'flex-start' }}>
          <ShieldCheck size={28} color={colors.primary} />
          <Text variant="callout">
            To protect you, payouts and new bank details are on hold until{' '}
            {heldUntil ? formatDate(heldUntil) : 'three days from now'}. If you didn’t do this,
            contact GetRentos support straight away.
          </Text>
        </View>
      )}
    </AuthScaffold>
  );
}
