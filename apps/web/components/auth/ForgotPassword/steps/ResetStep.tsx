'use client';

import { CheckCircle } from 'lucide-react';

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
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#c4a747] focus:border-transparent transition-all"
          placeholder="Enter new password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#c4a747] focus:border-transparent transition-all"
          placeholder="Confirm new password"
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <CheckCircle className="w-4 h-4 text-[#c4a747]" />
        <span>Password must be at least 8 characters</span>
      </div>
    </div>
  );
};
