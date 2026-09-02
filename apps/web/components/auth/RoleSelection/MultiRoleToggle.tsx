'use client';

import { motion } from 'framer-motion';
import { Users, AlertCircle } from 'lucide-react';

interface MultiRoleToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  /** 'card' = standalone panel; 'bar' = compact inline control for a footer action bar. */
  variant?: 'card' | 'bar';
}

export const MultiRoleToggle = ({ enabled, onToggle, variant = 'card' }: MultiRoleToggleProps) => {
  const switchControl = (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Enable multiple roles"
      onClick={() => onToggle(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (variant === 'bar') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Enable multiple roles</p>
          <p className="text-xs text-muted-foreground">Combine roles in one verified account</p>
        </div>
        {switchControl}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-secondary p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Enable multiple roles</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You can add more roles later with supporting documents
            </p>
          </div>
        </div>

        {switchControl}
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 border-t border-border pt-3"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
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
