'use client';

import { Eye } from 'lucide-react';
import { Alert } from '@getrentos/ui';

/**
 * The estate's note about somebody it matched but did not refuse.
 *
 * Shown after a write that succeeded, because a WATCH entry admits the visitor
 * on purpose: the estate wants to hear about them, and this is the guard
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
    <Alert variant="warning" icon={Eye} title="On the estate’s watch list">
      <p className="text-xs">{warning}</p>
    </Alert>
  );
};
