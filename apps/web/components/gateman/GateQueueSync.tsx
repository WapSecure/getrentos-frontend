'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { replayGateQueue } from '@/lib/gateOfflineQueue';

// Mounted in the gate console rather than the app root: the guard is the only one recording these writes, and the outcome shows on the verify screen.
export function GateQueueSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const summary = await replayGateQueue().catch(() => null);
      if (!cancelled && summary && summary.sent > 0) {
        queryClient.invalidateQueries({ queryKey: ['estate'] });
      }
    };

    void sync();
    window.addEventListener('online', sync);
    return () => {
      cancelled = true;
      window.removeEventListener('online', sync);
    };
  }, [queryClient]);

  return null;
}
