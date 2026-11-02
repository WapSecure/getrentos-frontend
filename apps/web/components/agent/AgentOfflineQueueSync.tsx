'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncAgentQueuedRecords } from '@/lib/agentQueueSync';

export function AgentOfflineQueueSync({ ownerId }: { ownerId?: string }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const sync = async () => {
      if (!ownerId) return;
      const result = await syncAgentQueuedRecords(undefined, ownerId);
      if (result.synced) await queryClient.invalidateQueries({ queryKey: ['agent'] });
    };
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [queryClient, ownerId]);
  return null;
}
