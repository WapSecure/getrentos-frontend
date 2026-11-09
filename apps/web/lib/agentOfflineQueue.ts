import type { agentService } from '@/services/agentService';
import { notifyAgentQueueChanged } from './agentQueueEvents';
import { currentAgentQueueOwner, requireAgentQueueOwner } from './agentQueueOwner';

export type AgentOfflineOperationType = 'inspection' | 'verification' | 'document' | 'message';

// Derived from the service signatures so a changed method fails the build, not a replay on an offline device with nowhere to report it.
export type AgentOfflinePayloads = {
  inspection: Parameters<typeof agentService.submitInspection>[0];
  verification: Parameters<typeof agentService.submitVerification>[0];
  document: Parameters<typeof agentService.uploadDocument>[0];
  message: { id: string; text: string; files?: File[] };
};

export type AgentOfflineOperation = {
  [K in AgentOfflineOperationType]: {
    id: string;
    type: K;
    payload: AgentOfflinePayloads[K];
    createdAt: string;
    /** Absent only on legacy records, which must not be assigned to a new account. */
    ownerId?: string;
  };
}[AgentOfflineOperationType];
const KEY = 'sureground.agent.offline-queue';
function readAll(): AgentOfflineOperation[] {
  const items = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (!Array.isArray(items))
    throw new Error('Device uploads could not be read. Existing records were kept.');
  return items;
}
export const agentOfflineQueue = {
  list: (ownerId = currentAgentQueueOwner()): AgentOfflineOperation[] => {
    if (!ownerId) return [];
    requireAgentQueueOwner(ownerId);
    return readAll().filter((item) => item.ownerId === ownerId);
  },
  unownedCount: () => readAll().filter((item) => !item.ownerId).length,
  // Generic so the payload is checked against its union member: the one place that stops a wrongly shaped payload being queued.
  enqueue: <K extends AgentOfflineOperationType>(
    type: K,
    payload: AgentOfflinePayloads[K],
    expectedOwner?: string
  ) => {
    const item = {
      id: crypto.randomUUID(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      ownerId: requireAgentQueueOwner(expectedOwner),
    } as AgentOfflineOperation;
    localStorage.setItem(KEY, JSON.stringify([...readAll(), item]));
    notifyAgentQueueChanged();
    return item;
  },
  remove: (id: string, expectedOwner: string) => {
    requireAgentQueueOwner(expectedOwner);
    localStorage.setItem(
      KEY,
      JSON.stringify(readAll().filter((item) => item.id !== id || item.ownerId !== expectedOwner))
    );
    notifyAgentQueueChanged();
  },
};
