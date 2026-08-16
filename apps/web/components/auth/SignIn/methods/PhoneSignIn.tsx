'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import {
  BACKEND_ROLE_TO_ID,
  ROUTES,
  VALIDATION_PATTERNS,
  getDashboardRoute,
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
  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: PhoneFormData) =>
      authService.login(identifier, password, rememberMe),
  });

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
      const { accessToken, ...user } = response.data;
      const primaryRoleId = BACKEND_ROLE_TO_ID[user.roles[0]] || 'renter';

      saveAuthSession(
        { accessToken, user: { ...user, fullName: user.legalName, role: primaryRoleId } },
        rememberMe
      );
      if (rememberMe) saveRememberedIdentifier(data.identifier);

      router.push(getDashboardRoute(primaryRoleId));
      showToast('Successfully signed in! Redirecting...', 'success');
    } else {
      onLoginAttempt();
      showToast(response.message || 'Invalid phone number or password. Please try again.', 'error');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
    </form>
  );
};
