'use client';

import { LegacyInput } from '@getrentos/ui';

import { Button, Input } from '@getrentos/ui';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
    control,
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

  // useWatch rather than watch(): watch() returns a function the React Compiler
  // cannot memoize, so calling it makes the compiler skip this whole component.
  const password = useWatch({ control, name: 'password' });
  const confirmPassword = useWatch({ control, name: 'confirmPassword' });

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
    <form method="post" onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
      {/* Full Name */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Full Name
        </label>
        <div
          className={`relative transition-all duration-200 ${focusedField === 'name' ? 'transform scale-[1.02]' : ''}`}
        >
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            {...register('fullName')}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.fullName ? 'border-destructive' : 'border-border'
            }`}
            placeholder="John Doe"
          />
        </div>
        {errors.fullName && (
          <p className="mt-1 text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email Address
        </label>
        <div
          className={`relative transition-all duration-200 ${focusedField === 'email' ? 'transform scale-[1.02]' : ''}`}
        >
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            {...register('email')}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.email ? 'border-destructive' : 'border-border'
            }`}
            placeholder="you@example.com"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Password
        </label>
        <div
          className={`relative transition-all duration-200 ${focusedField === 'password' ? 'transform scale-[1.02]' : ''}`}
        >
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.password ? 'border-destructive' : 'border-border'
            }`}
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        ? 'bg-destructive'
                        : level === 2
                          ? 'bg-warning'
                          : level === 3
                            ? 'bg-info'
                            : 'bg-success'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Password strength: {strengthText}
            </p>
          </div>
        )}

        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Confirm Password
        </label>
        <div
          className={`relative transition-all duration-200 ${focusedField === 'confirm' ? 'transform scale-[1.02]' : ''}`}
        >
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.confirmPassword ? 'border-destructive' : 'border-border'
            }`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Match Indicator */}
        {confirmPassword && password && (
          <div className="mt-1 flex items-center gap-1">
            {password === confirmPassword ? (
              <>
                <CheckCircle className="w-3 h-3 text-success" />
                <p className="text-xs text-success">Passwords match</p>
              </>
            ) : (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
        )}

        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive">
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
          className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground">
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
      <Button
        type="submit"
        disabled={!isValid}
        isLoading={isLoading}
        fullWidth
        size="lg"
        rounded="lg"
        icon={<ArrowRight className="w-4 h-4" />}
        iconPosition="right"
      >
        Create Account
      </Button>
    </form>
  );
};
