'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Input } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { Toast, ToastVariant } from '@getrentos/ui';
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
 * proceed — a hardened surface separate from end-user authentication.
 */
export const AdminSignInForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

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
    // Mount-time sync with persisted storage — intentional synchronous setState.
    /* eslint-disable react-hooks/set-state-in-effect */
    const remembered = getRememberedIdentifier();
    if (remembered) {
      setValue('identifier', remembered, { shouldValidate: true });
      setRememberMe(true);
    }
    if (consumeSessionExpiredFlag()) {
      setToast({ message: 'Your session has expired. Please sign in again.', variant: 'info' });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [setValue]);

  const completeSignIn = (result: AuthResult, identifier?: string) => {
    const isAdmin = (result.roles || []).some((r) => BACKEND_ROLE_TO_ID[r] === 'admin');
    if (!isAdmin) {
      setToast({
        message: 'This account does not have administrator access.',
        variant: 'error',
      });
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
      setToast({ message: response.message || 'Invalid credentials.', variant: 'error' });
      return;
    }

    if (isTwoFactorChallenge(response.data)) {
      setPendingChallenge(response.data.challengeToken);
      setTwoFactorCode('');
      setToast({
        message: 'Enter the 6-digit code from your authenticator app to continue.',
        variant: 'info',
      });
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
      setToast({
        message:
          response.message || 'The authentication code is invalid or has expired. Try again.',
        variant: 'error',
      });
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
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <svg
            viewBox="0 0 128 144"
            aria-hidden="true"
            className="aspect-[8/9] h-9 w-auto text-primary"
          >
            <path
              d="M16 44 64 14 112 44 112 70 96 70 96 53 64 33 32 53 32 91 64 110 88 96 88 79 68 79 68 63 104 63 104 105 64 129 16 100Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Administrator Sign In</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Restricted access — for GetRentos staff only
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {pendingChallenge ? (
          <>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Two-factor authentication
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to finish signing in.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Authentication code
              </label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(event) =>
                  setTwoFactorCode(
                    event.target.value.replace(VALIDATION_PATTERNS.NON_DIGITS, '').slice(0, 6)
                  )
                }
                inputClassName="py-3 text-center font-mono tracking-[0.5em]"
                placeholder="••••••"
                aria-label="Authentication code"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={twoFactorCode.length !== 6 || twoFactorMutation.isPending}
              isLoading={twoFactorMutation.isPending}
              onClick={completeTwoFactorSignIn}
            >
              <ShieldCheck className="h-4 w-4" />
              Verify and sign in
            </Button>

            <button
              type="button"
              onClick={cancelTwoFactor}
              className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                {...register('identifier')}
                inputClassName="py-3"
                placeholder="admin@getrentos.com"
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-500">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  inputClassName="py-3 pr-8"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isValid || loginMutation.isPending}
              isLoading={loginMutation.isPending}
            >
              <Lock className="h-4 w-4" />
              Sign in
            </Button>
          </>
        )}
      </form>
    </div>
  );
};
