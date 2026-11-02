import { unwrap } from '@/lib/apiHelpers';
import { agentService } from '@/services/agentService';
import { agentOfflineQueue, type AgentOfflineOperation } from './agentOfflineQueue';
import {
  listAgentBinaryOperations,
  removeAgentBinaryOperation,
  type AgentBinaryOperation,
} from './agentBinaryQueue';
import { notifyAgentQueueChanged } from './agentQueueEvents';

export type AgentQueuedRecord =
  | (AgentOfflineOperation & { storage: 'text' })
  | (AgentBinaryOperation & { storage: 'binary' });

export async function listAgentQueuedRecords(): Promise<AgentQueuedRecord[]> {
  return [
    ...agentOfflineQueue.list().map((item) => ({ ...item, storage: 'text' as const })),
    ...(await listAgentBinaryOperations()).map((item) => ({ ...item, storage: 'binary' as const })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function upload(item: AgentQueuedRecord) {
  if (item.storage === 'binary') {
    if (item.type === 'document') {
      await unwrap(
        agentService.uploadDocument({
          ...(item.payload as { name: string; category: string }),
          file: item.files[0],
        })
      );
    } else {
      const payload = item.payload as { id: string; text: string };
      await unwrap(agentService.sendMessage(payload.id, payload.text, item.files));
    }
    await removeAgentBinaryOperation(item.id);
    return;
  }
  switch (item.type) {
    case 'inspection':
      await unwrap(agentService.submitInspection(item.payload));
      break;
    case 'verification':
      await unwrap(agentService.submitVerification(item.payload));
      break;
    case 'document':
      await unwrap(agentService.uploadDocument(item.payload));
      break;
    case 'message':
      await unwrap(
        agentService.sendMessage(item.payload.id, item.payload.text, item.payload.files || [])
      );
      break;
  }
  // safeCall returns unsuccessful responses without throwing. Only unwrap's
  // confirmed success permits deleting the device's durable copy.
  agentOfflineQueue.remove(item.id);
}

export interface AgentSyncResult {
  synced: number;
  error?: string;
}

let pending: Promise<unknown> = Promise.resolve();

/** Serialize automatic and manual retries so a successful item is sent once. */
export function syncAgentQueuedRecords(id?: string): Promise<AgentSyncResult> {
  const run = pending.then(async (): Promise<AgentSyncResult> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, error: 'You are offline. Your records remain saved on this device.' };
    }
    let synced = 0;
    try {
      const records = await listAgentQueuedRecords();
      for (const record of records) {
        if (id && record.id !== id) continue;
        await upload(record);
        synced++;
      }
      return { synced };
    } catch (error) {
      return {
        synced,
        error:
          error instanceof Error
            ? error.message
            : 'Upload failed. Your record is still on this device.',
      };
    } finally {
      notifyAgentQueueChanged();
    }
  });
  pending = run.catch(() => undefined);
  return run;
}
