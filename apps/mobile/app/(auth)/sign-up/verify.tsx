import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { MailCheck } from 'lucide-react-native';
import { AuthScaffold, Button, OtpInput, Text, useTheme, useToast } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { useSignup } from '@/lib/auth/SignupContext';
import { haptics } from '@/lib/haptics';

const RESEND_SECONDS = 60;

export default function SignUpVerify() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const { draft, verify, resend } = useSignup();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!draft) router.replace('/(auth)/sign-up');
  }, [draft]);

  useEffect(() => {
    timer.current = setInterval(
      () =>
        setCooldown((c) => (c <= 1 && timer.current ? (clearInterval(timer.current), 0) : c - 1)),
      1000
    );
    return () => (timer.current ? clearInterval(timer.current) : undefined);
  }, []);

  const target = draft?.method === 'email' ? draft.email : draft?.phone;

  const submit = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verify(value);
      await haptics.success();
      router.push('/(auth)/sign-up/roles');
    } catch (err) {
      await haptics.error();
      setCode('');
      setError(err instanceof ApiError ? err.message : 'That code is invalid or has expired.');
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    try {
      await resend();
      setCooldown(RESEND_SECONDS);
      timer.current = setInterval(
        () =>
          setCooldown((c) => (c <= 1 && timer.current ? (clearInterval(timer.current), 0) : c - 1)),
        1000
      );
      toast.show('New code sent.', 'success');
    } catch {
      toast.show('Could not resend the code.', 'error');
    }
  };

  return (
    <AuthScaffold
      kicker="Verify"
      title={`Confirm your ${draft?.method === 'phone' ? 'phone' : 'email'}`}
      subtitle={`Enter the 6-digit code we sent to ${target ?? 'you'}.`}
      progress={2 / 3}
      onBack={() => router.back()}
      footer={
        <Button
          label="Verify & continue"
          loading={busy}
          disabled={code.length !== 6}
          onPress={() => submit()}
        />
      }
    >
      <View style={{ gap: spacing['2xl'], alignItems: 'center' }}>
        <Animated.View
          entering={ZoomIn.duration(280)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MailCheck size={26} color={colors.primary} />
        </Animated.View>

        <View style={{ alignSelf: 'stretch' }}>
          <OtpInput value={code} onChange={setCode} onComplete={submit} autoFocus />
        </View>

        <View>
          {cooldown > 0 ? (
            <Text variant="callout" color="mutedForeground">
              Resend code in {cooldown}s
            </Text>
          ) : (
            <Text
              variant="callout"
              color="primary"
              style={{ fontWeight: '700' }}
              onPress={onResend}
            >
              Resend code
            </Text>
          )}
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
