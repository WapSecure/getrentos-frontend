'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const AccountDeletion = () => {
  const [step, setStep] = useState<'confirm' | 'verify' | 'complete'>('confirm');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (confirmText !== 'delete my account') return;
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setStep('complete');
    }, 2000);
  };

  if (step === 'complete') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Account Deleted</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Your account has been successfully deleted. We&apos;re sorry to see you go.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Delete Account</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Permanently delete your account and all associated data
      </p>

      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          To confirm, type <span className="font-bold">delete my account</span> below
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type 'delete my account' to confirm"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <Button
        variant="danger"
        fullWidth
        className="mt-6 gap-2"
        onClick={handleDelete}
        disabled={confirmText !== 'delete my account' || isDeleting}
        isLoading={isDeleting}
      >
        <Trash2 className="w-4 h-4" />
        {isDeleting ? 'Deleting...' : 'Delete Account'}
      </Button>
    </div>
  );
};
