export type AgentOfflineOperation = { id: string; type: 'inspection' | 'verification' | 'document' | 'message'; payload: unknown; createdAt: string };
const KEY = 'getrentos.agent.offline-queue';
export const agentOfflineQueue = {
  list: (): AgentOfflineOperation[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } },
  enqueue: (type: AgentOfflineOperation['type'], payload: unknown) => { const item = { id: crypto.randomUUID(), type, payload, createdAt: new Date().toISOString() }; localStorage.setItem(KEY, JSON.stringify([...agentOfflineQueue.list(), item])); return item; },
  remove: (id: string) => localStorage.setItem(KEY, JSON.stringify(agentOfflineQueue.list().filter((item) => item.id !== id))),
};

export async function replayAgentOfflineQueue(dispatch: (item: AgentOfflineOperation) => Promise<void>) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  for (const item of agentOfflineQueue.list()) {
    try { await dispatch(item); agentOfflineQueue.remove(item.id); } catch { break; }
  }
}
