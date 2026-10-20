'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Alert, Checkbox, Field, Input, NumberInput } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { useToast } from '@getrentos/ui';
import { SessionExpiredNotice } from '@getrentos/ui';
import { Logo } from '@getrentos/ui';
import {
  BACKEND_ROLE_TO_ID,
  ROUTES,
  VALIDATION_PATTERNS,
  type AuthResult,
  type LoginResult,
  type TwoFactorChallenge,
} from '@getrentos/shared';
import {
  saveAuthSession,
  getRememberedIdentifier,
  saveRememberedIdentifier,
} from '@getrentos/shared';
import { consumeSessionExpiredFlag } from '@getrentos/shared';
import { authService } from '@getrentos/shared';

const adminSchema = z.object({
  identifier: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type AdminFormData = z.infer<typeof adminSchema>;

/**
 * Dedicated administrator sign-in. Uses the same credential store as the
 * public login, but only accounts that hold an admin role are allowed to
 * proceed: a hardened surface separate from end-user authentication.
 */
export const AdminSignInForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const toast = useToast();

  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: AdminFormData) =>
      authService.login(identifier, password, rememberMe, 'backoffice'),
  });
  const twoFactorMutation = useMutation({
    mutationFn: ({ challengeToken, token }: { challengeToken: string; token: string }) =>
      authService.completeTwoFactorLogin(challengeToken, token, 'backoffice'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    mode: 'onChange',
  });

  // Prefill the identifier if it was remembered, and explain an expired session.
  useEffect(() => {
    // Mount-time sync with persisted storage: intentional synchronous setState.
    /* eslint-disable react-hooks/set-state-in-effect */
    const remembered = getRememberedIdentifier();
    if (remembered) {
      setValue('identifier', remembered, { shouldValidate: true });
      setRememberMe(true);
    }
    if (consumeSessionExpiredFlag()) {
      toast.info('Your session has expired. Please sign in again.');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [setValue, toast]);

  const completeSignIn = (result: AuthResult, identifier?: string) => {
    const isAdmin = (result.roles || []).some((r) => BACKEND_ROLE_TO_ID[r] === 'admin');
    if (!isAdmin) {
      toast.error('This account does not have administrator access.');
      return;
    }

    const { accessToken, ...user } = result;
    saveAuthSession(
      {
        accessToken,
        user: { ...user, fullName: user.legalName, role: 'admin' },
      },
      rememberMe
    );
    if (rememberMe && identifier) saveRememberedIdentifier(identifier);

    router.push(ROUTES.ADMIN_DASHBOARD);
  };

  const isTwoFactorChallenge = (result: LoginResult): result is TwoFactorChallenge =>
    'requiresTwoFactor' in result &&
    result.requiresTwoFactor === true &&
    typeof result.challengeToken === 'string';

  const onSubmit = async (data: AdminFormData) => {
    const response = await loginMutation.mutateAsync(data);

    if (!response.success || !response.data) {
      toast.error(response.message || 'Invalid credentials.');
      return;
    }

    if (isTwoFactorChallenge(response.data)) {
      setPendingChallenge(response.data.challengeToken);
      setTwoFactorCode('');
      toast.info('Enter the 6-digit code from your authenticator app to continue.');
      return;
    }

    completeSignIn(response.data, data.identifier);
  };

  const completeTwoFactorSignIn = async () => {
    if (!pendingChallenge || twoFactorCode.length !== 6) return;

    const response = await twoFactorMutation.mutateAsync({
      challengeToken: pendingChallenge,
      token: twoFactorCode,
    });

    if (!response.success || !response.data) {
      setTwoFactorCode('');
      toast.error(
        response.message || 'The authentication code is invalid or has expired. Try again.'
      );
      return;
    }

    completeSignIn(response.data);
  };

  const cancelTwoFactor = () => {
    setPendingChallenge(null);
    setTwoFactorCode('');
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Logo href={ROUTES.ADMIN_LOGIN} size="lg" className="mx-auto mb-4 w-fit" />
        <h1 className="text-2xl font-bold text-foreground">Administrator Sign In</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Restricted access: for GetRentos staff only
        </p>
      </div>

      <SessionExpiredNotice />

      <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {pendingChallenge ? (
          <>
            <Alert variant="info" icon={ShieldCheck} title="Two-factor authentication">
              Enter the 6-digit code from your authenticator app to finish signing in.
            </Alert>

            <Field label="Authentication code">
              <NumberInput
                autoComplete="one-time-code"
                maxLength={6}
                value={twoFactorCode}
                onValueChange={(value) =>
                  setTwoFactorCode(value.replace(VALIDATION_PATTERNS.NON_DIGITS, '').slice(0, 6))
                }
                inputClassName="py-3 text-center font-mono tracking-[0.5em]"
                placeholder="••••••"
              />
            </Field>

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={twoFactorCode.length !== 6 || twoFactorMutation.isPending}
              isLoading={twoFactorMutation.isPending}
              icon={<ShieldCheck className="h-4 w-4" />}
              onClick={completeTwoFactorSignIn}
            >
              Verify and sign in
            </Button>

            <Button type="button" variant="ghost" fullWidth onClick={cancelTwoFactor}>
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <Field label="Email" error={errors.identifier?.message}>
              <Input
                type="email"
                {...register('identifier')}
                inputClassName="py-3"
                placeholder="admin@getrentos.com"
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <Input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                inputClassName="py-3"
                placeholder="Enter your password"
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </Field>

            <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} label="Remember me" />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isValid || loginMutation.isPending}
              isLoading={loginMutation.isPending}
              icon={<Lock className="h-4 w-4" />}
            >
              Sign in
            </Button>
          </>
        )}
      </form>
    </div>
  );
};
