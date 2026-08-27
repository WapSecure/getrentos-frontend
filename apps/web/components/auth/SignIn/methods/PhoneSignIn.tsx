'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import {
  BACKEND_ROLE_TO_ID,
  ROUTES,
  VALIDATION_PATTERNS,
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

const phoneSchema = z.object({
  identifier: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .regex(VALIDATION_PATTERNS.PHONE, 'Invalid phone number format'),
  password: z.string().min(1, 'Password is required'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

interface PhoneSignInProps {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  showToast: (message: string, variant: ToastVariant) => void;
  onLoginAttempt: () => void;
  isLocked: boolean;
  lockoutTimer: number | null;
}

export const PhoneSignIn = ({
  isLoading,
  setIsLoading,
  showToast,
  onLoginAttempt,
  isLocked,
  lockoutTimer,
}: PhoneSignInProps) => {
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
    mutationFn: ({ identifier, password }: PhoneFormData) =>
      authService.login(identifier, password, rememberMe),
  });

  const finishLogin = (result: AuthResult, identifier?: string) => {
    const primaryRoleId = BACKEND_ROLE_TO_ID[result.roles[0]] || 'renter';

    saveAuthSession(
      {
        accessToken: result.accessToken,
        user: { ...result, fullName: result.legalName, role: primaryRoleId },
      },
      rememberMe
    );
    if (rememberMe && identifier) saveRememberedIdentifier(identifier);

    router.push(getDashboardRoute(primaryRoleId));
  };

  const isTwoFactorChallenge = (result: LoginResult): result is TwoFactorChallenge =>
    'requiresTwoFactor' in result &&
    result.requiresTwoFactor === true &&
    typeof result.challengeToken === 'string';

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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, touchedFields },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    mode: 'onChange',
  });

  // Prefill the identifier when the user previously signed in with "Remember me",
  // and surface a notice when the previous session expired.
  useEffect(() => {
    // Mount-time sync with persisted storage — intentional synchronous setState.
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

  const onSubmit = async (data: PhoneFormData) => {
    if (isLocked) {
      showToast(`Too many failed attempts. Please try again in ${lockoutTimer} seconds.`, 'error');
      return;
    }

    setIsLoading(true);
    const response = await loginMutation.mutateAsync(data);

    if (response.success && response.data) {
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
      showToast(response.message || 'Invalid phone number or password. Please try again.', 'error');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {pendingChallenge ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="mb-2 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Two-factor authentication
              </p>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Enter the 6-digit code from your authenticator app to finish signing in.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            disabled={twoFactorCode.length !== 6 || isVerifying2fa}
            isLoading={isVerifying2fa}
            onClick={completeTwoFactorLogin}
          >
            <ShieldCheck className="h-4 w-4" />
            Verify &amp; Sign In
          </Button>

          <button
            type="button"
            onClick={cancelTwoFactor}
            className="w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Input
                type="tel"
                {...register('identifier')}
                className={
                  errors.identifier
                    ? 'border-red-500'
                    : touchedFields.identifier
                      ? 'border-green-500'
                      : undefined
                }
                inputClassName="py-3"
                placeholder="+1 234 567 8900"
              />
              {touchedFields.identifier && !errors.identifier && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
              {errors.identifier && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>
            {errors.identifier && (
              <p className="mt-1 text-sm text-red-500">{errors.identifier.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                inputClassName="py-3 pr-8"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <LegacyInput
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            <a
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Forgot password?
            </a>
          </div>

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
