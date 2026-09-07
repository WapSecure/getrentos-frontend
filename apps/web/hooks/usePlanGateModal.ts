import { useState } from 'react';
import { isPlanGateError, type PlanGateReason } from '@/lib/planGate';

/**
 * Wire into a mutation's onError: `onError: (err) => planGate.handleError(err)`.
 * If `err` is a Pro-gate/limit-cap error it opens the upgrade modal and
 * returns true; otherwise it returns false so the caller can fall through to
 * its own generic error handling (toast, etc.) for anything else.
 */
export function usePlanGateModal() {
  const [reason, setReason] = useState<PlanGateReason | null>(null);

  return {
    isOpen: reason !== null,
    reason: reason ?? undefined,
    close: () => setReason(null),
    handleError: (err: unknown): boolean => {
      if (isPlanGateError(err)) {
        setReason(err.code);
        return true;
      }
      return false;
    },
  };
}
