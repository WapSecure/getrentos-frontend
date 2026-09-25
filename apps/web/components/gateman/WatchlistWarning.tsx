'use client';

import { Eye } from 'lucide-react';

/**
 * The estate's note about somebody it matched but did not refuse.
 *
 * Shown after a write that succeeded, because a WATCH entry admits the visitor
 * on purpose — the estate wants to hear about them, and this is the guard
 * finding out in time to pass it on. Until this existed the sentence was composed
 * on the server and thrown away, so the severity did nothing a guard could see.
 *
 * Deliberately not the red refusal panel, and not an error: nobody was refused.
 * A guard who reads it as a problem starts second-guessing an admission the
 * estate already decided to allow.
 */
export const WatchlistWarning = ({ warning }: { warning?: string }) => {
  if (!warning) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
      <Eye className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium">On the estate&apos;s watch list</p>
        <p className="text-xs opacity-80 mt-0.5">{warning}</p>
      </div>
    </div>
  );
};
