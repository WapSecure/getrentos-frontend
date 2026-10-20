'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { Alert, Button, Checkbox, Field, IconButton, Input, NumberInput } from '@getrentos/ui';
import {
  resolvePrimaryRoleId,
  ROUTES,
  getDashboardRoute,
  type AuthResult,
  type LoginResult,
  type TwoFactorChallenge,
} from '@/lib/constants/auth';
import { ToastVariant } from '@getrentos/ui';
import { authService } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';
import {
  getRememberedIdentifier,
  saveAuthSession,
  saveRememberedIdentifier,
} from '@/lib/authStorage';
import { consumeSessionExpiredFlag } from '@/lib/apiClient';

const emailSchema = z.object({
  identifier: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailSignInProps {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  showToast: (message: string, variant: ToastVariant) => void;
  onLoginAttempt: () => void;
  isLocked: boolean;
  lockoutTimer: number | null;
  /** Internal destination to return to after login (from ?next=). */
  nextPath?: string | null;
}

export const EmailSignIn = ({
  isLoading,
  setIsLoading,
  showToast,
  onLoginAttempt,
  isLocked,
  lockoutTimer,
  nextPath,
}: EmailSignInProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<{
    token: string;
    identifier: string;
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);
  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: EmailFormData) =>
      authService.login(identifier, password, rememberMe),
  });

  /** Saves the session and navigates to the role dashboard. */
  const finishLogin = (result: AuthResult, identifier?: string) => {
    const primaryRoleId = resolvePrimaryRoleId(result.roles);
    saveAuthSession(
      {
        accessToken: result.accessToken,
        user: { ...result, fullName: result.legalName, role: primaryRoleId },
      },
      rememberMe
    );
    if (rememberMe && identifier) saveRememberedIdentifier(identifier);
    // Bounce the user back to their intended destination when present (e.g.
    // deep links gated by the proxy), otherwise the role dashboard.
    router.push(nextPath || getDashboardRoute(primaryRoleId));
  };

  const completeTwoFactorLogin = async () => {
    if (!pendingChallenge || twoFactorCode.length !== 6) return;
    setIsVerifying2fa(true);
    const response = await authService.completeTwoFactorLogin(
      pendingChallenge.token,
      twoFactorCode
    );
    if (response.success && response.data) {
      finishLogin(response.data, pendingChallenge.identifier);
      showToast('Successfully signed in! Redirecting...', 'success');
    } else {
      setTwoFactorCode('');
      showToast(response.message || 'The code is invalid or has expired. Try again.', 'error');
    }
    setIsVerifying2fa(false);
  };

  const cancelTwoFactor = () => {
    setPendingChallenge(null);
    setTwoFactorCode('');
  };

  const isTwoFactorChallenge = (result: LoginResult): result is TwoFactorChallenge =>
    'requiresTwoFactor' in result &&
    result.requiresTwoFactor === true &&
    typeof result.challengeToken === 'string';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, touchedFields },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
  });

  // Prefill the identifier when the user previously signed in with "Remember me",
  // and surface a notice when the previous session expired.
  useEffect(() => {
    // Mount-time sync with persisted storage: intentional synchronous setState.
    /* eslint-disable react-hooks/set-state-in-effect */
    const remembered = getRememberedIdentifier();
    if (remembered) {
      setValue('identifier', remembered, { shouldValidate: true });
      setRememberMe(true);
    }
    if (consumeSessionExpiredFlag()) {
      showToast('Your session has expired. Please sign in again.', 'info');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [setValue, showToast]);

  const onSubmit = async (data: EmailFormData) => {
    if (isLocked) {
      showToast(`Too many failed attempts. Please try again in ${lockoutTimer} seconds.`, 'error');
      return;
    }

    setIsLoading(true);
    const response = await loginMutation.mutateAsync(data);

    if (response.success && response.data) {
      // Account has two-factor authentication: hold the challenge token and
      // prompt for the authenticator-app code before issuing a session.
      if (isTwoFactorChallenge(response.data)) {
        setPendingChallenge({ token: response.data.challengeToken, identifier: data.identifier });
        setTwoFactorCode('');
        showToast('Enter the 6-digit code from your authenticator app to continue.', 'info');
        setIsLoading(false);
        return;
      }

      finishLogin(response.data, data.identifier);
      showToast('Successfully signed in! Redirecting...', 'success');
    } else {
      onLoginAttempt();
      showToast(response.message || 'Invalid email or password. Please try again.', 'error');
    }

    setIsLoading(false);
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {pendingChallenge ? (
        /* Two-factor authentication step */
        <div className="space-y-4">
          <Alert variant="info" icon={ShieldCheck} title="Two-factor authentication">
            Enter the 6-digit code from your authenticator app to finish signing in.
          </Alert>

          <Field label="Authentication code">
            <NumberInput
              autoComplete="one-time-code"
              maxLength={6}
              value={twoFactorCode}
              onValueChange={setTwoFactorCode}
              inputClassName="py-3 text-center tracking-[0.5em] font-mono"
              placeholder="••••••"
            />
          </Field>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            disabled={twoFactorCode.length !== 6 || isVerifying2fa}
            isLoading={isVerifying2fa}
            onClick={completeTwoFactorLogin}
          >
            <ShieldCheck className="w-4 h-4" />
            Verify &amp; Sign In
          </Button>

          <Button type="button" variant="ghost" fullWidth onClick={cancelTwoFactor}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <>
          <Field label="Email address" error={errors.identifier?.message}>
            <Input
              type="email"
              autoComplete="email"
              {...register('identifier')}
              className={touchedFields.identifier && !errors.identifier ? 'border-success' : undefined}
              inputClassName="py-3"
              placeholder="you@example.com"
              trailingIcon={
                touchedFields.identifier && !errors.identifier ? (
                  <CheckCircle className="w-5 h-5 text-success" aria-hidden="true" />
                ) : errors.identifier ? (
                  <XCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
                ) : undefined
              }
            />
          </Field>

          <Field
            label="Password"
            labelAside={
              <a
                href={ROUTES.FORGOT_PASSWORD}
                className="font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Forgot password?
              </a>
            }
          >
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              inputClassName="py-3"
              placeholder="Enter your password"
              trailingIcon={
                <IconButton
                  size="sm"
                  className="-mr-2"
                  label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <EyeOff /> : <Eye />}
                  onClick={() => setShowPassword(!showPassword)}
                />
              }
            />
          </Field>

          <Checkbox
            label="Remember me"
            checked={rememberMe}
            onCheckedChange={setRememberMe}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValid || isLoading || loginMutation.isPending || isLocked}
            isLoading={isLoading || loginMutation.isPending}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </>
      )}
    </form>
  );
};
