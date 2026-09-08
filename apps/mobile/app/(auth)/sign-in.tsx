import { useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AtSign, Sparkles, Lock } from 'lucide-react-native';
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
import { haptics } from '@/lib/haptics';
import { signInSchema, type SignInValues } from '@/lib/validation';

type Method = 'password' | 'magic';

export default function SignIn() {
  const { signIn } = useAuth();
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const passwordRef = useRef<TextInput>(null);
  const [method, setMethod] = useState<Method>('password');
  const [formError, setFormError] = useState<string | null>(null);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicBusy, setMagicBusy] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async ({ identifier, password }) => {
    setFormError(null);
    try {
      const { requiresTwoFactor } = await signIn(identifier, password);
      await haptics.success();
      if (requiresTwoFactor) router.push('/(auth)/two-factor');
    } catch (err) {
      await haptics.error();
      setFormError(
        err instanceof ApiError
          ? err.isNetwork
            ? 'Can’t reach GetRentos. Check your connection.'
            : err.message
          : 'Sign-in failed. Please try again.'
      );
    }
  });

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
            <Button label="Sign in" loading={isSubmitting} onPress={onSubmit} />
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
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onSubmitEditing={onSubmit}
                  error={errors.password?.message}
                />
              )}
            />
            <Row style={{ justifyContent: 'flex-end' }}>
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

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button
            label="Google"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => toast.show('Social sign-in is coming to the app shortly.', 'info')}
          />
          <Button
            label="Apple"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => toast.show('Social sign-in is coming to the app shortly.', 'info')}
          />
        </View>
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
