export const AGENT_QUEUE_CHANGED = 'sureground:agent-queue-changed';

export function notifyAgentQueueChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AGENT_QUEUE_CHANGED));
}
