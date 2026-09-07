import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { AtSign, Phone, MessageCircle, KeyRound } from 'lucide-react-native';
import {
  AuthScaffold,
  Button,
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
import {
  EMAIL_RE,
  PHONE_RE,
  resetPasswordSchema,
  type ResetPasswordValues,
} from '@/lib/validation';

type Step = 'request' | 'otp' | 'reset';
const RESEND_SECONDS = 60;

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
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  useEffect(() => () => (timer.current ? clearInterval(timer.current) : undefined), []);

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timer.current) clearInterval(timer.current);
        return c - 1;
      });
    }, 1000);
  };

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
      setStep('otp');
      startCooldown();
      toast.show(`Code sent to your ${method === 'whatsapp' ? 'WhatsApp' : method}.`, 'success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send a reset code.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || !reference) return;
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
    if (!reference || cooldown > 0) return;
    try {
      await authApi.resendOtp(reference);
      startCooldown();
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

  const stepIndex = { request: 0, otp: 1, reset: 2 }[step];

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
      onBack={() => {
        if (step === 'otp') setStep('request');
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
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            autoCorrect={false}
            value={identifier}
            onChangeText={setIdentifier}
            onSubmitEditing={sendCode}
            error={error ?? undefined}
          />
        </Animated.View>
      ) : step === 'otp' ? (
        <Animated.View entering={SlideInRight.duration(220)} style={{ gap: spacing.xl }}>
          <OtpInput value={code} onChange={setCode} onComplete={verify} autoFocus />
          <View style={{ alignItems: 'center' }}>
            {cooldown > 0 ? (
              <Text variant="callout" color="mutedForeground">
                Resend code in {cooldown}s
              </Text>
            ) : (
              <Text
                variant="callout"
                color="primary"
                style={{ fontWeight: '700' }}
                onPress={resend}
              >
                Resend code
              </Text>
            )}
          </View>
          {error ? (
            <Text variant="callout" color="destructive" center>
              {error}
            </Text>
          ) : null}
        </Animated.View>
      ) : (
        <Animated.View entering={SlideInRight.duration(220)} style={{ gap: spacing.lg }}>
          <View
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
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={doReset}
                error={errors.confirmPassword?.message}
              />
            )}
          />
          {error ? (
            <Text variant="callout" color="destructive">
              {error}
            </Text>
          ) : null}
        </Animated.View>
      )}
    </AuthScaffold>
  );
}
