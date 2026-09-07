import { useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { haptics } from '@/lib/haptics';
import { Button, Screen, Text, TextField, useTheme } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

const schema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your email or phone number')
    .refine(
      (v) => /^\S+@\S+\.\S+$/.test(v) || /^[0-9+][0-9\s-]{6,}$/.test(v),
      'Enter a valid email or phone number'
    ),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const { signIn } = useAuth();
  const { spacing } = useTheme();
  const passwordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async ({ identifier, password }) => {
    setFormError(null);
    try {
      const { requiresTwoFactor } = await signIn(identifier, password);
      await haptics.success();
      if (requiresTwoFactor) router.push('/(auth)/two-factor');
      // else: the (auth) layout redirects to (app) once status flips.
    } catch (err) {
      await haptics.error();
      setFormError(
        err instanceof ApiError
          ? err.isNetwork
            ? 'Can’t reach GetRentos. Check your connection and try again.'
            : err.message
          : 'Sign-in failed. Please try again.'
      );
    }
  });

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing['4xl'], marginBottom: spacing.xl }}>
        <Text variant="label" color="primary" uppercase>
          Welcome back
        </Text>
        <Text variant="title">Sign in to GetRentos</Text>
        <Text variant="body" color="mutedForeground">
          The trust-driven property operating system.
        </Text>
      </View>

      <View style={{ gap: spacing.lg }}>
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Email or phone"
              placeholder="you@example.com"
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

        {formError ? (
          <Text variant="callout" color="destructive">
            {formError}
          </Text>
        ) : null}

        <Button
          label="Sign in"
          fullWidth
          loading={isSubmitting}
          onPress={onSubmit}
          style={{ marginTop: spacing.xs }}
        />

        <Button
          label="Sign in with a magic link"
          variant="ghost"
          fullWidth
          onPress={() => router.push('/(auth)/magic-link')}
        />
      </View>
    </Screen>
  );
}
