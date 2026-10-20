'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Fingerprint, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ToastVariant } from '@getrentos/ui';
import { authService } from '@/services/authService';

const magicLinkSchema = z.object({
  identifier: z.string().email('Please enter a valid email address'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

interface MagicLinkSignInProps {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  showToast: (message: string, variant: ToastVariant) => void;
}

export const MagicLinkSignIn = ({ isLoading, setIsLoading, showToast }: MagicLinkSignInProps) => {
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true);

    try {
      const response = await authService.sendMagicLink(data.identifier);
      if (response.success) {
        setMagicLinkSent(true);
        showToast('Magic link sent! Please check your email.', 'success');
      } else {
        showToast(response.message || 'Failed to send magic link. Please try again.', 'error');
      }
    } catch {
      showToast('Failed to send magic link. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <LegacyInput
            type="email"
            {...register('identifier')}
            className={`w-full px-4 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.identifier
                ? 'border-destructive'
                : touchedFields.identifier
                  ? 'border-success'
                  : 'border-border'
            }`}
            placeholder="you@example.com"
          />
          {touchedFields.identifier && !errors.identifier && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
          )}
          {errors.identifier && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
          )}
        </div>
        {errors.identifier && (
          <p className="mt-1 text-sm text-destructive">{errors.identifier.message}</p>
        )}
      </div>

      <div className="p-3 rounded-lg bg-secondary text-sm text-muted-foreground">
        <p>We&apos;ll email you a secure magic link. No password needed!</p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={!isValid || isLoading || magicLinkSent}
        isLoading={isLoading}
      >
        <Fingerprint className="w-4 h-4" />
        {magicLinkSent ? 'Link Sent' : 'Send Magic Link'}
      </Button>
    </form>
  );
};
