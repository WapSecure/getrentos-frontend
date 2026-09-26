import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { AtSign, KeyRound, MessageCircle, Phone } from 'lucide-react-native';
import {
  AuthScaffold,
  Button,
  FormAlert,
  LinkButton,
  OtpInput,
  PasswordField,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { authApi, type OtpMethod } from '@/lib/api/auth';
import { haptics } from '@/lib/haptics';
import { useCountdown } from '@/hooks/useCountdown';
import {
  EMAIL_RE,
  PHONE_RE,
  resetPasswordSchema,
  type ResetPasswordValues,
} from '@/lib/validation';

type Step = 'request' | 'otp' | 'reset';
const RESEND_SECONDS = 60;
const STEP_INDEX: Record<Step, number> = { request: 0, otp: 1, reset: 2 };

export default function ForgotPassword() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [step, setStep] = useState<Step>('request');
  const [method, setMethod] = useState<OtpMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldown = useCountdown();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const channelLabel = method === 'whatsapp' ? 'WhatsApp' : method;
  const identifierValid =
    method === 'email' ? EMAIL_RE.test(identifier.trim()) : PHONE_RE.test(identifier.trim());

  const sendCode = async () => {
    if (!identifierValid) {
      setError(method === 'email' ? 'Enter a valid email address' : 'Enter a valid phone number');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { reference: ref } = await authApi.sendOtp(identifier.trim(), method, 'password_reset');
      setReference(ref);
      setCode('');
      setStep('otp');
      cooldown.start(RESEND_SECONDS);
      toast.show(`Code sent to your ${channelLabel}.`, 'success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send a reset code.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || !reference || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { verified } = await authApi.verifyOtp(reference, value);
      if (!verified) throw new ApiError('That code is invalid or has expired.', 400);
      await haptics.success();
      setStep('reset');
    } catch (err) {
      await haptics.error();
      setCode('');
      setError(err instanceof ApiError ? err.message : 'That code is invalid or has expired.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!reference || cooldown.running) return;
    try {
      await authApi.resendOtp(reference);
      cooldown.start(RESEND_SECONDS);
      setError(null);
      toast.show('New code sent.', 'success');
    } catch {
      toast.show('Could not resend the code.', 'error');
    }
  };

  const doReset = handleSubmit(async ({ password }) => {
    if (!reference) return;
    setBusy(true);
    setError(null);
    try {
      await authApi.resetPassword(reference, password);
      await haptics.success();
      toast.show('Password updated. Sign in with your new password.', 'success');
      router.replace('/(auth)/sign-in');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset your password.');
    } finally {
      setBusy(false);
    }
  });

  const backToRequest = () => {
    setStep('request');
    setCode('');
    setError(null);
  };

  const stepIndex = STEP_INDEX[step];

  return (
    <AuthScaffold
      kicker="Account recovery"
      title={step === 'reset' ? 'Set a new password' : 'Reset your password'}
      subtitle={
        step === 'request'
          ? 'We’ll send a code to confirm it’s you.'
          : step === 'otp'
            ? `Enter the 6-digit code sent to ${identifier.trim()}.`
            : 'Choose a strong password you don’t use anywhere else.'
      }
      progress={(stepIndex + 1) / 3}
      progressLabel={`Recovery step ${stepIndex + 1} of 3`}
      onBack={() => {
        if (step === 'otp') backToRequest();
        else if (step === 'reset') setStep('otp');
        else router.back();
      }}
      footer={
        step === 'request' ? (
          <Button
            label="Send reset code"
            loading={busy}
            disabled={!identifierValid}
            onPress={sendCode}
          />
        ) : step === 'otp' ? (
          <Button
            label="Verify code"
            loading={busy}
            disabled={code.length !== 6}
            onPress={() => verify()}
          />
        ) : (
          <Button label="Update password" loading={busy} onPress={doReset} />
        )
      }
    >
      {step === 'request' ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ gap: spacing.xl }}>
          <SegmentedControl<OtpMethod>
            accessibilityLabel="Send the code by"
            value={method}
            onChange={(m) => {
              setMethod(m);
              setIdentifier('');
              setError(null);
            }}
            options={[
              {
                value: 'email',
                label: 'Email',
                icon: <AtSign size={15} color={colors.mutedForeground} />,
              },
              {
                value: 'phone',
                label: 'Phone',
                icon: <Phone size={15} color={colors.mutedForeground} />,
              },
              {
                value: 'whatsapp',
                label: 'WhatsApp',
                icon: <MessageCircle size={15} color={colors.mutedForeground} />,
              },
            ]}
          />
          <TextField
            label={method === 'email' ? 'Email address' : 'Phone number'}
            placeholder={method === 'email' ? 'you@example.com' : '+234 801 234 5678'}
            leftIcon={
              method === 'email' ? (
                <AtSign size={18} color={colors.mutedForeground} />
              ) : (
                <Phone size={18} color={colors.mutedForeground} />
              )
            }
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            autoComplete={method === 'email' ? 'email' : 'tel'}
            textContentType={method === 'email' ? 'emailAddress' : 'telephoneNumber'}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            value={identifier}
            onChangeText={(v) => {
              setIdentifier(v);
              if (error) setError(null);
            }}
            onSubmitEditing={sendCode}
          />
          <FormAlert message={error} />
        </Animated.View>
      ) : step === 'otp' ? (
        <Animated.View
          entering={SlideInRight.duration(220)}
          style={{ gap: spacing.xl, alignItems: 'center' }}
        >
          <View style={{ alignSelf: 'stretch' }}>
            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                if (error) setError(null);
              }}
              onComplete={verify}
              invalid={!!error}
              disabled={busy}
              autoFocus
            />
          </View>
          {cooldown.running ? (
            <Text
              variant="callout"
              color="mutedForeground"
              accessibilityLabel={`You can request a new code in ${cooldown.remaining} seconds`}
            >
              Resend code in {cooldown.remaining}s
            </Text>
          ) : (
            <LinkButton label="Resend code" onPress={resend} />
          )}
          <LinkButton
            label={`Use a different ${method === 'email' ? 'email' : 'number'}`}
            tone="muted"
            onPress={backToRequest}
          />
          <View style={{ alignSelf: 'stretch' }}>
            <FormAlert message={error} />
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={SlideInRight.duration(220)} style={{ gap: spacing.lg }}>
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyRound size={24} color={colors.primary} />
          </View>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                label="New password"
                placeholder="At least 8 characters"
                showStrength
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
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
                returnKeyType="done"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={doReset}
                error={errors.confirmPassword?.message}
              />
            )}
          />
          <FormAlert message={error} />
        </Animated.View>
      )}
    </AuthScaffold>
  );
}
