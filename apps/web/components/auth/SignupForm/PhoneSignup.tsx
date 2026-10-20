'use client';

import { Button, Checkbox, Field, IconButton, Input } from '@getrentos/ui';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowRight, User, Phone, Lock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useSignupStore } from '@/lib/store/signupStore';
import { phoneSchema, PhoneFormData } from '@/lib/validations/auth';

interface PhoneSignupProps {
  onSubmit: (phone: string) => Promise<void>;
  isLoading: boolean;
}

export const PhoneSignup = ({ onSubmit, isLoading }: PhoneSignupProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { setData } = useSignupStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    mode: 'onChange',
    defaultValues: {
      phone: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  // useWatch rather than watch(): watch() returns a function the React Compiler
  // cannot memoize, so calling it makes the compiler skip this whole component.
  const password = useWatch({ control, name: 'password' });
  const confirmPassword = useWatch({ control, name: 'confirmPassword' });

  const onSubmitForm = async (data: PhoneFormData) => {
    setData({
      phone: data.phone,
      fullName: data.fullName,
      password: data.password,
      method: 'phone',
    });
    await onSubmit(data.phone);
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
      <Field label="Full name" error={errors.fullName?.message}>
        <Input
          type="text"
          autoComplete="name"
          {...register('fullName')}
          leadingIcon={<User className="w-4 h-4" />}
          inputClassName="py-3"
          placeholder="John Doe"
        />
      </Field>

      <Field label="Phone number" error={errors.phone?.message}>
        <Input
          type="tel"
          autoComplete="tel"
          {...register('phone')}
          leadingIcon={<Phone className="w-4 h-4" />}
          inputClassName="py-3"
          placeholder="+1 234 567 8900"
        />
      </Field>

      <Field
        label="Password"
        error={errors.password?.message}
        hint={password ? `Password strength: ${strengthText}` : undefined}
      >
        <Input
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          {...register('password')}
          leadingIcon={<Lock className="w-4 h-4" />}
          inputClassName="py-3"
          placeholder="Create a password"
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
        {password && (
          <div className="flex gap-1" aria-hidden="true">
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
        )}
      </Field>

      <Field label="Confirm password" error={errors.confirmPassword?.message}>
        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          {...register('confirmPassword')}
          leadingIcon={<Lock className="w-4 h-4" />}
          inputClassName="py-3"
          placeholder="Confirm your password"
          trailingIcon={
            <IconButton
              size="sm"
              className="-mr-2"
              label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              icon={showConfirmPassword ? <EyeOff /> : <Eye />}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        />
        {confirmPassword && password && !errors.confirmPassword && (
          <div className="flex items-center gap-1">
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
      </Field>

      <Checkbox
        required
        checked={agreedToTerms}
        onCheckedChange={setAgreedToTerms}
        label={
          <span className="text-xs font-normal text-muted-foreground">
            I agree to the{' '}
            <a
              href="/terms"
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
          </span>
        }
      />

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isValid || !agreedToTerms}

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
