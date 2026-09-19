import type { agentService } from '@/services/agentService';

/** The four things the field app can queue while it has no connection. */
export type AgentOfflineOperationType = 'inspection' | 'verification' | 'document' | 'message';

/**
 * Payload shapes are derived from the service methods that will eventually receive
 * them, so changing a submit signature breaks here rather than at replay time — on
 * a device, with the queue already rehydrated from localStorage.
 */
export type AgentOfflinePayloads = {
  inspection: Parameters<typeof agentService.submitInspection>[0];
  verification: Parameters<typeof agentService.submitVerification>[0];
  document: Parameters<typeof agentService.uploadDocument>[0];
  message: {
    id: Parameters<typeof agentService.sendMessage>[0];
    text: Parameters<typeof agentService.sendMessage>[1];
    files: Parameters<typeof agentService.sendMessage>[2];
  };
};

/**
 * A queued operation, discriminated by `type` so replay can narrow the payload to
 * the shape the matching call expects instead of casting it away.
 */
export type AgentOfflineOperation = {
  [K in AgentOfflineOperationType]: {
    id: string;
    type: K;
    payload: AgentOfflinePayloads[K];
    createdAt: string;
  };
}[AgentOfflineOperationType];

const KEY = 'getrentos.agent.offline-queue';
export const agentOfflineQueue = {
  list: (): AgentOfflineOperation[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  },
  enqueue: <K extends AgentOfflineOperationType>(type: K, payload: AgentOfflinePayloads[K]) => {
    const item = { id: crypto.randomUUID(), type, payload, createdAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify([...agentOfflineQueue.list(), item]));
    return item;
  },
  remove: (id: string) =>
    localStorage.setItem(
      KEY,
      JSON.stringify(agentOfflineQueue.list().filter((item) => item.id !== id))
    ),
};

export async function replayAgentOfflineQueue(
  dispatch: (item: AgentOfflineOperation) => Promise<void>
) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  for (const item of agentOfflineQueue.list()) {
    try {
      await dispatch(item);
      agentOfflineQueue.remove(item.id);
    } catch {
      break;
    }
  }
}
