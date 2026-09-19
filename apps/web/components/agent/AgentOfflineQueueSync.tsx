'use client';

import { useEffect } from 'react';
import {
  agentOfflineQueue,
  replayAgentOfflineQueue,
  type AgentOfflineOperation,
} from '@/lib/agentOfflineQueue';
import { agentService } from '@/services/agentService';
import { listAgentBinaryOperations, removeAgentBinaryOperation } from '@/lib/agentBinaryQueue';

async function dispatch(item: AgentOfflineOperation) {
  // Switch rather than a chain of `if`s on a payload cast to any: each branch
  // narrows `item` to one member of the union, so the service call is checked
  // against the exact payload that member carries.
  switch (item.type) {
    case 'inspection':
      await agentService.submitInspection(item.payload);
      break;
    case 'verification':
      await agentService.submitVerification(item.payload);
      break;
    case 'document':
      await agentService.uploadDocument(item.payload);
      break;
    case 'message':
      await agentService.sendMessage(item.payload.id, item.payload.text, item.payload.files || []);
      break;
  }
}

export function AgentOfflineQueueSync() {
  useEffect(() => {
    const sync = async () => {
      await replayAgentOfflineQueue(dispatch);
      for (const item of await listAgentBinaryOperations()) {
        try {
          if (item.type === 'document')
            await agentService.uploadDocument({
              ...(item.payload as { name: string; category: string }),
              file: item.files[0],
            });
          if (item.type === 'message')
            await agentService.sendMessage(
              (item.payload as { id: string }).id,
              (item.payload as { text: string }).text,
              item.files
            );
          await removeAgentBinaryOperation(item.id);
        } catch {
          break;
        }
      }
    };
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
  return null;
}
