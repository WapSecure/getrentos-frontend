import { useEffect, useRef, useState } from 'react';
import { Pressable, View, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AtSign, Sparkles, Lock, Check } from 'lucide-react-native';
import {
  AuthScaffold,
  Button,
  PressableScale,
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
import { signInSchema, type SignInValues } from '@/lib/validation';

type Method = 'password' | 'magic';

// Mirrors the web client's soft lockout (backend enforces its own).
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export default function SignIn() {
  const { signIn, signInWithProvider } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const passwordRef = useRef<TextInput>(null);
  const [method, setMethod] = useState<Method>('password');
  const [formError, setFormError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicBusy, setMagicBusy] = useState(false);

  const attempts = useRef(0);
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
        attempts.current = 0;
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
      attempts.current = 0;
      if (rememberMe) rememberIdentifier(identifier);
      else forgetIdentifier();
      await haptics.success();
      if (requiresTwoFactor) router.push('/(auth)/two-factor');
    } catch (err) {
      await haptics.error();
      attempts.current += 1;
      if (attempts.current >= MAX_ATTEMPTS) {
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
      onBack={() => router.back()}
      footer={
        method === 'password' ? (
          <>
            <Button label="Sign in" loading={isSubmitting} disabled={locked} onPress={onSubmit} />
            <Row>
              <Text variant="callout" color="mutedForeground">
                New to GetRentos?{' '}
              </Text>
              <PressableScale haptic={false} onPress={() => router.replace('/(auth)/sign-up')}>
                <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                  Create an account
                </Text>
              </PressableScale>
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
          <View
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.warningSubtle,
              borderWidth: 1,
              borderColor: colors.warning,
            }}
          >
            <Text variant="callout" style={{ color: colors.warning, fontWeight: '600' }}>
              Account temporarily locked. Try again in {lockLabel}.
            </Text>
          </View>
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
                  autoComplete="password"
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
              <Pressable
                onPress={() => setRememberMe((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: radius.sm - 3,
                    borderWidth: 1.5,
                    borderColor: rememberMe ? colors.primary : colors.border,
                    backgroundColor: rememberMe ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {rememberMe ? (
                    <Check size={12} color={colors.primaryForeground} strokeWidth={3} />
                  ) : null}
                </View>
                <Text variant="callout" color="mutedForeground">
                  Remember me
                </Text>
              </Pressable>
              <PressableScale haptic={false} onPress={() => router.push('/(auth)/forgot-password')}>
                <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
                  Forgot password?
                </Text>
              </PressableScale>
            </Row>
          </Animated.View>
        ) : (
          <Animated.View key="magic" entering={FadeIn.duration(180)} style={{ gap: spacing.md }}>
            {magicSent ? (
              <Text variant="body">
                Link sent to <Text variant="bodyStrong">{magicEmail.trim()}</Text>. Open it on this
                device to sign in.
              </Text>
            ) : (
              <TextField
                label="Email"
                placeholder="you@example.com"
                leftIcon={<AtSign size={18} color={colors.mutedForeground} />}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={magicEmail}
                onChangeText={setMagicEmail}
                onSubmitEditing={sendMagic}
              />
            )}
          </Animated.View>
        )}

        {formError ? (
          <Animated.View entering={FadeIn.duration(160)}>
            <Text variant="callout" color="destructive">
              {formError}
            </Text>
          </Animated.View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text variant="caption" color="mutedForeground">
            or continue with
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <Button
          label="Continue with Google"
          variant="outline"
          loading={oauthBusy}
          onPress={signInGoogle}
        />
        <Text variant="caption" color="mutedForeground" center>
          By continuing you agree to our Terms & Privacy Policy.
        </Text>
      </View>
    </AuthScaffold>
  );
}

function Row({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, style]}>
      {children}
    </View>
  );
}
