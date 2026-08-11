'use client';

import { motion } from 'framer-motion';
import { Users, AlertCircle } from 'lucide-react';

interface MultiRoleToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export const MultiRoleToggle = ({ enabled, onToggle }: MultiRoleToggleProps) => {
  return (
    <div className="bg-secondary rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Enable multiple roles</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You can add more roles later with supporting documents
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-border"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              You&apos;ll need to verify each role separately with the required documents. Your
              trust score will increase with each successful verification.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
