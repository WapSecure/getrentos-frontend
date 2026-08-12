'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { renterService } from '@/services/renterService';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants/auth';

export const AccountDeletion = () => {
  const router = useRouter();
  const [step, setStep] = useState<'confirm' | 'verify' | 'complete'>('confirm');
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'delete my account' || !password) return;
    setIsDeleting(true);
    setError(null);
    const res = await renterService.deleteAccount(password);
    setIsDeleting(false);
    if (res.success) {
      setStep('complete');
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setTimeout(() => router.push(ROUTES.LOGIN), 2000);
    } else {
      setError(res.message || 'Failed to delete account');
    }
  };

  if (step === 'complete') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-red-600" />
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
      <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Delete Account</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Permanently delete your account and all associated data
      </p>

      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Warning</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              This action is permanent and cannot be undone. All your data, including applications,
              payments, messages, and lease agreements will be permanently deleted.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          To confirm, type <span className="font-bold">delete my account</span> below
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type 'delete my account' to confirm"
          className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Enter your password to confirm
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <Button
        variant="danger"
        fullWidth
        className="mt-6 gap-2"
        onClick={handleDelete}
        disabled={confirmText !== 'delete my account' || !password || isDeleting}
        isLoading={isDeleting}
      >
        <Trash2 className="w-4 h-4" />
        {isDeleting ? 'Deleting...' : 'Delete Account'}
      </Button>
    </div>
  );
};
