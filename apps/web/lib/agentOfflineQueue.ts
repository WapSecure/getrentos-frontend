import { agentService } from '@/services/agentService';

export type AgentOfflineOperationType = 'inspection' | 'verification' | 'document' | 'message';

/**
 * Each queued operation carries exactly the payload its service call needs, so a
 * replay can switch on `type` and get the right payload type without a cast.
 *
 * Derived from the service signatures rather than restated, so changing a method
 * fails the build here instead of at runtime on a device that is offline and has
 * nowhere to report the error.
 */
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
  // Generic in the type so the payload is checked against that member of the
  // union — the one place that stops a wrongly-shaped payload being queued.
  enqueue: <K extends AgentOfflineOperationType>(type: K, payload: AgentOfflinePayloads[K]) => {
    // Rebuilt rather than spread, so the mapped type is satisfied by construction.
    const item = {
      id: crypto.randomUUID(),
      type,
      payload,
      createdAt: new Date().toISOString(),
    } as AgentOfflineOperation;
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
