import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { MailCheck, MessageCircle, Smartphone } from 'lucide-react-native';
import {
  AuthScaffold,
  Button,
  FormAlert,
  LinkButton,
  OtpInput,
  Text,
  useReducedMotion,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { useSignup } from '@/lib/auth/SignupContext';
import { haptics } from '@/lib/haptics';
import { useCountdown } from '@/hooks/useCountdown';

const RESEND_SECONDS = 60;

export default function SignUpVerify() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const { draft, verify, resend, reset } = useSignup();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldown = useCountdown(RESEND_SECONDS);

  useEffect(() => {
    if (!draft) router.replace('/(auth)/sign-up');
  }, [draft]);

  const target = draft?.method === 'email' ? draft.email : draft?.phone;
  const channel =
    draft?.otpMethod === 'whatsapp' ? 'WhatsApp' : draft?.method === 'phone' ? 'phone' : 'email';
  const Icon =
    channel === 'WhatsApp' ? MessageCircle : channel === 'phone' ? Smartphone : MailCheck;

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
    if (cooldown.running) return;
    try {
      await resend();
      cooldown.start(RESEND_SECONDS);
      setError(null);
      toast.show('New code sent.', 'success');
    } catch {
      toast.show('Could not resend the code.', 'error');
    }
  };

  return (
    <AuthScaffold
      kicker="Verify"
      title={`Confirm your ${channel}`}
      subtitle={`Enter the 6-digit code we sent to ${target ?? 'you'}.`}
      progress={2 / 3}
      progressLabel="Sign-up step 2 of 3"
      onBack={() => router.back()}
      footer={
        <>
          <Button
            label="Verify & continue"
            loading={busy}
            disabled={code.length !== 6}
            onPress={() => submit()}
          />
          <View style={{ alignItems: 'center' }}>
            <LinkButton
              label={`Wrong ${channel === 'email' ? 'email' : 'number'}? Start over`}
              tone="muted"
              onPress={() => {
                reset();
                router.replace('/(auth)/sign-up');
              }}
            />
          </View>
        </>
      }
    >
      <View style={{ gap: spacing['2xl'], alignItems: 'center' }}>
        <Animated.View
          entering={reduceMotion ? undefined : ZoomIn.duration(280)}
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
          <Icon size={26} color={colors.primary} />
        </Animated.View>

        <View style={{ alignSelf: 'stretch' }}>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            onComplete={submit}
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
          <LinkButton label="Resend code" onPress={onResend} />
        )}

        <View style={{ alignSelf: 'stretch' }}>
          <FormAlert message={error} />
        </View>
      </View>
    </AuthScaffold>
  );
}
