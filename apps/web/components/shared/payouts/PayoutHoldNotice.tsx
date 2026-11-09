'use client';

import { Clock } from '@sureground/icons';

// The backend refuses payouts to a recently changed account until `holdUntil`; saying so lets someone who didn't make the change act.
export function PayoutHoldNotice({ holdUntil }: { holdUntil?: string | null }) {
  // The API only sends a hold while it is still running.
  if (!holdUntil) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
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
        . If you didn’t make this change, contact Sureground support now.
      </span>
    </p>
  );
}

/** Same words as mobile. */
export { PAYOUT_CHANGE_COOLDOWN_HINT } from '@sureground/shared';
