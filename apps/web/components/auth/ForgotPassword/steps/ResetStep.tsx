'use client';

import { CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface ResetStepProps {
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
}

export const ResetStep = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
}: ResetStepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          New Password
        </label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          inputClassName="py-3"
          placeholder="Enter new password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Confirm Password
        </label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          inputClassName="py-3"
          placeholder="Confirm new password"
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <CheckCircle className="w-4 h-4 text-primary" />
        <span>Password must be at least 8 characters</span>
      </div>
    </div>
  );
};
