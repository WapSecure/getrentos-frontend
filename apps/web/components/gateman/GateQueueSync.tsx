'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { replayGateQueue } from '@/lib/gateOfflineQueue';

/**
 * Drains the gate's offline queue.
 *
 * Mounted inside the gate console rather than at the app root: a guard is the
 * only person who records these writes, and the console is where they will be
 * looking when the connection returns. Rendering nothing is the point — the
 * queue's state and the drain's outcome are shown on the verify screen where the
 * guard acts, not as a banner across every screen in the app.
 *
 * The browser counterpart of `apps/mobile/components/gateman/GateQueueSync.tsx`.
 */
export function GateQueueSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const summary = await replayGateQueue().catch(() => null);
      // Refresh the console's view of who is inside as soon as writes land.
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
