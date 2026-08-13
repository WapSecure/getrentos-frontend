'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { Input } from '@/components/ui/Input';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useSignupStore } from '@/lib/store/signupStore';
import { emailSchema, EmailFormData } from '@/lib/validations/auth';

interface EmailSignupProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
}

export const EmailSignup = ({ onSubmit, isLoading }: EmailSignupProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { setData } = useSignupStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmitForm = async (data: EmailFormData) => {
    setData({
      email: data.email,
      fullName: data.fullName,
      password: data.password,
      method: 'email',
    });
    await onSubmit(data.email);
  };

  const passwordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/[0-9]/)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const strengthLevel = password ? passwordStrength(password) : 0;
  const strengthText = ['Weak', 'Fair', 'Good', 'Strong'][strengthLevel - 1] || '';

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
      {/* Full Name */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Full Name
        </label>
        <div
          className={`relative transition-all duration-200 ${focusedField === 'name' ? 'transform scale-[1.02]' : ''}`}
        >
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            {...register('fullName')}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="John Doe"
          />
        </div>
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email Address
        </label>
        <div
          className={`relative transition-all duration-200 ${focusedField === 'email' ? 'transform scale-[1.02]' : ''}`}
        >
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="email"
            {...register('email')}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="you@example.com"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Password
        </label>
        <div
          className={`relative transition-all duration-200 ${focusedField === 'password' ? 'transform scale-[1.02]' : ''}`}
        >
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <Input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    strengthLevel >= level
                      ? level === 1
                        ? 'bg-red-500'
                        : level === 2
                          ? 'bg-yellow-500'
                          : level === 3
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Password strength: {strengthText}
            </p>
          </div>
        )}

        {errors.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Confirm Password
        </label>
        <div
          className={`relative transition-all duration-200 ${focusedField === 'confirm' ? 'transform scale-[1.02]' : ''}`}
        >
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Match Indicator */}
        {confirmPassword && password && (
          <div className="mt-1 flex items-center gap-1">
            {password === confirmPassword ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <p className="text-xs text-green-600 dark:text-green-400">Passwords match</p>
              </>
            ) : (
              <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
          </div>
        )}

        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms Agreement */}
      <div className="flex items-start gap-2">
        <LegacyInput
          type="checkbox"
          id="terms"
          required
          className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
        />
        <label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400">
          I agree to the{' '}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </label>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={!isValid || isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Create Account
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>
    </form>
  );
};
