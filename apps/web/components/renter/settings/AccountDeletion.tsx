'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Trash2, Check } from 'lucide-react';
import { Alert, Button, Field, Input } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { ROUTES } from '@/lib/constants/auth';
import { logoutSession } from '@/lib/apiClient';

export const AccountDeletion = () => {
  const router = useRouter();
  const [step, setStep] = useState<'confirm' | 'verify' | 'complete'>('confirm');
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: () => renterService.deleteAccount(password),
    onSuccess: (res) => {
      if (res.success) {
        setStep('complete');
        void logoutSession();
        setTimeout(() => router.push(ROUTES.LOGIN), 2000);
      } else {
        setError(res.message || 'Failed to delete account');
      }
    },
  });

  const handleDelete = () => {
    if (confirmText !== 'delete my account' || !password) return;
    setError(null);
    deleteMutation.mutate();
  };

  if (step === 'complete') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive-subtle flex items-center justify-center">
          <Check className="w-8 h-8 text-destructive" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Account Deleted</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Your account has been successfully deleted. We&apos;re sorry to see you go.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-destructive mb-4">Delete Account</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Permanently delete your account and all associated data
      </p>

      <Alert variant="danger" title="Warning">
        This action is permanent and cannot be undone. All your data, including applications,
        payments, messages, and lease agreements will be permanently deleted.
      </Alert>

      <Field
        className="mt-6"
        label={
          <>
            To confirm, type <span className="font-bold">delete my account</span> below
          </>
        }
      >
        <Input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type 'delete my account' to confirm"
        />
      </Field>

      <Field className="mt-4" label="Enter your password to confirm" error={error}>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
      </Field>

      <Button
        variant="danger"
        fullWidth
        className="mt-6"
        onClick={handleDelete}
        disabled={confirmText !== 'delete my account' || !password}
        isLoading={deleteMutation.isPending}
        loadingText="Deleting..."
        icon={<Trash2 className="w-4 h-4" />}
      >
        Delete Account
      </Button>
    </div>
  );
};
