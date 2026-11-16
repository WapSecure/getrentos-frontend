import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { MailCheck, MessageCircle, Smartphone } from '@sureground/icons/native';
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
} from '@sureground/ui-native';
import { AUTH_CONSTANTS, formatPhoneForDisplay } from '@sureground/shared';
import { errorMessage } from '@/lib/api/client';
import { useSignup } from '@/lib/auth/SignupContext';
import { codeSendErrorCopy, retryAfterSeconds } from '@/lib/auth/signupErrors';
import { haptics } from '@/lib/haptics';
import { useCountdown } from '@/hooks/useCountdown';
import { goBack } from '@/lib/goBack';

const RESEND_SECONDS = AUTH_CONSTANTS.RESEND_OTP_DELAY_SECONDS;
const CODE_LIFETIME_MINUTES = 10;

export default function SignUpVerify() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const { draft, sentAt, verify, resend, reset } = useSignup();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstWait] = useState(() =>
    sentAt ? Math.max(0, Math.ceil(RESEND_SECONDS - (Date.now() - sentAt) / 1000)) : RESEND_SECONDS
  );
  const cooldown = useCountdown(firstWait);

  useEffect(() => {
    if (!draft) router.replace('/(auth)/sign-up');
  }, [draft]);

  const isEmail = draft?.method === 'email';
  const target = isEmail ? draft?.email : formatPhoneForDisplay(draft?.phone);
  const channel = draft?.otpMethod === 'whatsapp' ? 'whatsapp' : isEmail ? 'email' : 'phone';
  const Icon =
    channel === 'whatsapp' ? MessageCircle : channel === 'phone' ? Smartphone : MailCheck;
  const title =
    channel === 'whatsapp'
      ? 'Check WhatsApp'
      : channel === 'phone'
        ? 'Check your phone'
        : 'Check your email';

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
      setError(errorMessage(err, 'That code is invalid or has expired.'));
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (cooldown.running || resending) return;
    setResending(true);
    setError(null);
    try {
      await resend();
      cooldown.start(RESEND_SECONDS);
      toast.show('New code sent.', 'success');
    } catch (err) {
      const wait = retryAfterSeconds(err);
      if (wait) cooldown.start(wait);
      setError(codeSendErrorCopy(err, 'Could not send a new code. Try again.'));
    } finally {
      setResending(false);
    }
  };

  const startOver = () => {
    reset();
    router.replace('/(auth)/sign-up');
  };

  return (
    <AuthScaffold
      kicker="Step 2 of 3"
      title={title}
      subtitle={`Enter the 6-digit code we sent to ${target || 'you'}.`}
      progress={2 / 3}
      progressLabel="Sign-up step 2 of 3"
      onBack={() => goBack()}
      footer={<Button label="Verify and continue" loading={busy} onPress={() => submit()} />}
      footerSecondary={
        <View style={{ alignItems: 'center' }}>
          <LinkButton
            label={`Wrong ${isEmail ? 'email' : 'number'}? Start over`}
            tone="muted"
            onPress={startOver}
          />
        </View>
      }
    >
      <View style={{ gap: spacing.xl, alignItems: 'center' }}>
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

        <Text variant="callout" color="mutedForeground" center>
          {`Code expires in ${CODE_LIFETIME_MINUTES} minutes.${isEmail ? ' Check spam.' : ''}`}
        </Text>

        <View style={{ alignSelf: 'stretch' }}>
          <FormAlert message={error} />
        </View>

        {cooldown.running ? (
          <Text
            variant="callout"
            color="mutedForeground"
            accessibilityLabel={`You can ask for a new code in ${cooldown.remaining} seconds`}
          >
            New code in {cooldown.remaining}s
          </Text>
        ) : (
          <LinkButton
            label={resending ? 'Sending…' : 'Send a new code'}
            disabled={resending}
            onPress={onResend}
          />
        )}
      </View>
    </AuthScaffold>
  );
}
