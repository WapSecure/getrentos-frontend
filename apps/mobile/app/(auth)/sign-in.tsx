import { useEffect, useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AtSign, Sparkles, Lock, ShieldCheck } from 'lucide-react-native';
import {
  AuthScaffold,
  Button,
  Checkbox,
  FormAlert,
  LinkButton,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthProvider';
import { OAuthCancelled } from '@/lib/auth/oauth';
import { consumeSessionExpired } from '@/lib/auth/sessionExpiry';
import {
  forgetIdentifier,
  getRememberedIdentifier,
  rememberIdentifier,
} from '@/lib/auth/rememberedIdentifier';
import { haptics } from '@/lib/haptics';
import { openLegal } from '@/lib/links';
import { GoogleMark } from '@/components/auth/GoogleMark';
import { signInSchema, type SignInValues } from '@/lib/validation';

type Method = 'password' | 'magic';

// Mirrors the web client's soft lockout (backend enforces its own).
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export default function SignIn() {
  const { signIn, signInWithProvider } = useAuth();
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const passwordRef = useRef<TextInput>(null);
  const [method, setMethod] = useState<Method>('password');
  const [formError, setFormError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicBusy, setMagicBusy] = useState(false);

  // A state counter, not a ref: the submit handler below is built during render,
  // so reading a ref from it counts as accessing a ref during render.
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockSecs, setLockSecs] = useState(0);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onTouched',
  });

  // Prefill a remembered identifier; surface an involuntary sign-out.
  useEffect(() => {
    getRememberedIdentifier().then((v) => {
      if (v) {
        setValue('identifier', v, { shouldValidate: true });
        setRememberMe(true);
      }
    });
    if (consumeSessionExpired()) {
      toast.show('Your session has expired. Please sign in again.', 'info');
    }
    // once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lockout countdown.
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockSecs(left);
      if (left === 0) {
        setLockedUntil(null);
        setAttempts(0);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const locked = !!lockedUntil;
  const lockLabel = `${Math.floor(lockSecs / 60)}:${(lockSecs % 60).toString().padStart(2, '0')}`;

  const onSubmit = handleSubmit(async ({ identifier, password }) => {
    if (locked) return;
    setFormError(null);
    try {
      const { requiresTwoFactor } = await signIn(identifier, password);
      setAttempts(0);
      if (rememberMe) rememberIdentifier(identifier);
      else forgetIdentifier();
      await haptics.success();
      if (requiresTwoFactor) router.push('/(auth)/two-factor');
    } catch (err) {
      await haptics.error();
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        // This body is an event handler: react-hook-form's handleSubmit invokes it
        // on submit, never during render. The compiler cannot see that because RHF
        // is on its incompatible-library list, so it reads this as render-time.
        // eslint-disable-next-line react-hooks/purity
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setFormError(null);
        toast.show('Too many attempts. Try again in 15 minutes.', 'error');
        return;
      }
      setFormError(
        err instanceof ApiError
          ? err.isNetwork
            ? 'Can’t reach GetRentos. Check your connection.'
            : err.message
          : 'Sign-in failed. Please try again.'
      );
    }
  });

  const signInGoogle = async () => {
    if (oauthBusy) return;
    setOauthBusy(true);
    setFormError(null);
    try {
      await signInWithProvider('google');
      await haptics.success();
    } catch (err) {
      if (!(err instanceof OAuthCancelled)) {
        await haptics.error();
        setFormError(
          err instanceof ApiError ? err.message : 'Could not sign in with Google. Try again.'
        );
      }
    } finally {
      setOauthBusy(false);
    }
  };

  const sendMagic = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(magicEmail.trim())) {
      setFormError('Enter a valid email address');
      return;
    }
    setMagicBusy(true);
    setFormError(null);
    try {
      await authApi.sendMagicLink(magicEmail.trim());
      setMagicSent(true);
      toast.show('Check your inbox for a sign-in link.', 'success');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not send the link.');
    } finally {
      setMagicBusy(false);
    }
  };

  return (
    <AuthScaffold
      kicker="Welcome back"
      title="Sign in"
      subtitle="Pick up where you left off."
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))}
      footer={
        method === 'password' ? (
          <>
            <Button label="Sign in" loading={isSubmitting} disabled={locked} onPress={onSubmit} />
            <Row>
              <Text variant="callout" color="mutedForeground">
                New to GetRentos?{' '}
              </Text>
              <LinkButton
                label="Create an account"
                onPress={() => router.replace('/(auth)/sign-up')}
              />
            </Row>
          </>
        ) : magicSent ? (
          <Button
            label="Back to password sign-in"
            variant="secondary"
            onPress={() => setMethod('password')}
          />
        ) : (
          <Button label="Email me a link" loading={magicBusy} onPress={sendMagic} />
        )
      }
    >
      <View style={{ gap: spacing.xl }}>
        <SegmentedControl<Method>
          accessibilityLabel="Sign-in method"
          value={method}
          onChange={(m) => {
            setMethod(m);
            setFormError(null);
            setMagicSent(false);
          }}
          options={[
            {
              value: 'password',
              label: 'Password',
              icon: <Lock size={15} color={colors.mutedForeground} />,
            },
            {
              value: 'magic',
              label: 'Magic link',
              icon: <Sparkles size={15} color={colors.mutedForeground} />,
            },
          ]}
        />

        {locked ? (
          <FormAlert
            tone="warning"
            title="Account temporarily locked"
            message={`Too many attempts. Try again in ${lockLabel}.`}
          />
        ) : null}

        {method === 'password' ? (
          <Animated.View key="pw" entering={FadeIn.duration(180)} style={{ gap: spacing.lg }}>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Email or phone"
                  placeholder="you@example.com"
                  leftIcon={<AtSign size={18} color={colors.mutedForeground} />}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  keyboardType="email-address"
                  returnKeyType="next"
                  editable={!locked}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  error={errors.identifier?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  ref={passwordRef}
                  label="Password"
                  placeholder="Your password"
                  secure
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  editable={!locked}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onSubmitEditing={onSubmit}
                  error={errors.password?.message}
                />
              )}
            />
            <Row style={{ justifyContent: 'space-between' }}>
              <Checkbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
              <LinkButton
                label="Forgot password?"
                onPress={() => router.push('/(auth)/forgot-password')}
              />
            </Row>
          </Animated.View>
        ) : (
          <Animated.View key="magic" entering={FadeIn.duration(180)} style={{ gap: spacing.md }}>
            {magicSent ? (
              <FormAlert
                tone="success"
                title="Check your inbox"
                message={`We sent a sign-in link to ${magicEmail.trim()}. Open it on this device.`}
              />
            ) : (
              <TextField
                label="Email"
                placeholder="you@example.com"
                hint="We’ll email you a one-tap sign-in link — no password needed."
                leftIcon={<AtSign size={18} color={colors.mutedForeground} />}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="send"
                value={magicEmail}
                onChangeText={setMagicEmail}
                onSubmitEditing={sendMagic}
              />
            )}
          </Animated.View>
        )}

        <FormAlert message={formError} />

        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text variant="caption" color="mutedForeground">
            or
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <Button
          label="Continue with Google"
          variant="outline"
          icon={<GoogleMark />}
          loading={oauthBusy}
          onPress={signInGoogle}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <ShieldCheck size={16} color={colors.success} />
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            Encrypted sessions and optional 2-step verification keep your account yours.
          </Text>
        </View>
        <LegalNote />
      </View>
    </AuthScaffold>
  );
}

function LegalNote() {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="caption" color="mutedForeground">
        By continuing you agree to our{' '}
      </Text>
      <LinkButton label="Terms" onPress={() => openLegal('terms')} style={{ minHeight: 32 }} />
      <Text variant="caption" color="mutedForeground">
        {' '}
        and{' '}
      </Text>
      <LinkButton
        label="Privacy Policy"
        onPress={() => openLegal('privacy')}
        style={{ minHeight: 32 }}
      />
    </View>
  );
}

function Row({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, style]}>
      {children}
    </View>
  );
}
