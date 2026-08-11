'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BACKEND_ROLE_TO_ID, ROUTES, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import { ToastVariant } from '@/components/ui/Toast';
import { authService } from '@/services/authService';

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
}

export const EmailSignIn = ({
  isLoading,
  setIsLoading,
  showToast,
  onLoginAttempt,
  isLocked,
  lockoutTimer,
}: EmailSignInProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: EmailFormData) => {
    if (isLocked) {
      showToast(`Too many failed attempts. Please try again in ${lockoutTimer} seconds.`, 'error');
      return;
    }

    setIsLoading(true);

    const response = await authService.login(data.identifier, data.password);

    if (response.success && response.data) {
      const { accessToken, refreshToken, ...user } = response.data;
      const primaryRoleId = BACKEND_ROLE_TO_ID[user.roles[0]] || 'renter';

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...user, role: primaryRoleId }));

      router.push(getDashboardRoute(primaryRoleId));
      showToast('Successfully signed in! Redirecting...', 'success');
    } else {
      onLoginAttempt();
      showToast(response.message || 'Invalid email or password. Please try again.', 'error');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            {...register('identifier')}
            className={`w-full px-4 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.identifier
                ? 'border-red-500'
                : touchedFields.identifier
                  ? 'border-green-500'
                  : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="you@example.com"
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
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className="w-full px-4 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-10"
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
          <input
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
        disabled={!isValid || isLoading || isLocked}
        isLoading={isLoading}
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </Button>
    </form>
  );
};
