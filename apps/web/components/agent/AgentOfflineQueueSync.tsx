'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncAgentQueuedRecords } from '@/lib/agentQueueSync';

export function AgentOfflineQueueSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const sync = async () => {
      const result = await syncAgentQueuedRecords();
      if (result.synced) await queryClient.invalidateQueries({ queryKey: ['agent'] });
    };
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [queryClient]);
  return null;
}
