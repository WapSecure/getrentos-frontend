import { useState } from 'react';
import { isPlanGateError, type PlanGateReason } from '@/lib/planGate';

export function usePlanGateModal() {
  const [reason, setReason] = useState<PlanGateReason | null>(null);

  return {
    isOpen: reason !== null,
    reason: reason ?? undefined,
    close: () => setReason(null),
    handleError: (err: unknown): boolean => {
      if (isPlanGateError(err)) {
        setReason(err.reason);
        return true;
      }
      return false;
    },
  };
}
