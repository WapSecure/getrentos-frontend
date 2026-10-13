'use client';

import { Clock } from 'lucide-react';

/**
 * Shown while a recently changed payout account is inside its cooldown. The
 * backend refuses payouts to it until `holdUntil`; this says so, and why, so a
 * delayed payout is not a mystery — and so someone who did not make the change
 * knows to act.
 */
export function PayoutHoldNotice({ holdUntil }: { holdUntil?: string | null }) {
  // The API only sends a hold while it is still running.
  if (!holdUntil) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        This account was changed recently. To protect you, payouts to it start{' '}
        {new Date(holdUntil).toLocaleString('en-NG', {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}
        . If you didn’t make this change, contact GetRentos support now.
      </span>
    </p>
  );
}

/** One line telling people, before they save, what a change does. */
export const PAYOUT_CHANGE_COOLDOWN_HINT =
  'Changing your bank details pauses payouts to the new account for 24 hours, and we’ll email you about it.';
