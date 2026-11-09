import { unwrap } from '@/lib/apiHelpers';
import { agentService } from '@/services/agentService';
import { agentOfflineQueue, type AgentOfflineOperation } from './agentOfflineQueue';
import {
  listAgentBinaryOperations,
  removeAgentBinaryOperation,
  type AgentBinaryOperation,
  unownedAgentBinaryCount,
} from './agentBinaryQueue';
import { notifyAgentQueueChanged } from './agentQueueEvents';
import { requireAgentQueueOwner } from './agentQueueOwner';

export type AgentQueuedRecord =
  | (AgentOfflineOperation & { storage: 'text' })
  | (AgentBinaryOperation & { storage: 'binary' });

export async function listAgentQueuedRecords(expectedOwner?: string): Promise<AgentQueuedRecord[]> {
  const ownerId = requireAgentQueueOwner(expectedOwner);
  return [
    ...agentOfflineQueue.list(ownerId).map((item) => ({ ...item, storage: 'text' as const })),
    ...(await listAgentBinaryOperations(ownerId)).map((item) => ({
      ...item,
      storage: 'binary' as const,
    })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function unownedAgentRecordCount(): Promise<number> {
  return agentOfflineQueue.unownedCount() + (await unownedAgentBinaryCount());
}

async function upload(item: AgentQueuedRecord, ownerId: string) {
  requireAgentQueueOwner(ownerId);
  if (item.ownerId !== ownerId) throw new Error('This upload belongs to a different account.');
  if (item.storage === 'binary') {
    if (item.type === 'document') {
      await unwrap(
        agentService.uploadDocument(
          {
            ...(item.payload as { name: string; category: string }),
            file: item.files[0],
          },
          ownerId
        )
      );
    } else {
      const payload = item.payload as { id: string; text: string };
      await unwrap(agentService.sendMessage(payload.id, payload.text, item.files, ownerId));
    }
    await removeAgentBinaryOperation(item.id, ownerId);
    return;
  }
  switch (item.type) {
    case 'inspection':
      await unwrap(agentService.submitInspection(item.payload, ownerId));
      break;
    case 'verification':
      await unwrap(agentService.submitVerification(item.payload, ownerId));
      break;
    case 'document':
      await unwrap(agentService.uploadDocument(item.payload, ownerId));
      break;
    case 'message':
      await unwrap(
        agentService.sendMessage(
          item.payload.id,
          item.payload.text,
          item.payload.files || [],
          ownerId
        )
      );
      break;
    default:
      throw new Error(
        'This device record could not be read for upload. It has been kept for review.'
      );
  }
  // safeCall does not throw on failure: only unwrap's confirmed success may delete the device's durable copy.
  agentOfflineQueue.remove(item.id, ownerId);
}

export interface AgentSyncResult {
  synced: number;
  error?: string;
}

let pending: Promise<unknown> = Promise.resolve();

// Serialises automatic and manual retries so a successful item is sent once.
export function syncAgentQueuedRecords(
  id?: string,
  expectedOwner?: string
): Promise<AgentSyncResult> {
  // Bind the request before waiting for another tab or a prior upload.
  const ownerId = expectedOwner ?? requireAgentQueueOwner();
  const drain = async (): Promise<AgentSyncResult> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, error: 'You are offline. Your records remain saved on this device.' };
    }
    let synced = 0;
    try {
      const records = await listAgentQueuedRecords(ownerId);
      for (const record of records) {
        if (id && record.id !== id) continue;
        await upload(record, ownerId);
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
  };
  const run = pending.then(async (): Promise<AgentSyncResult> => {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return navigator.locks.request('sureground-agent-upload', drain);
    }
    return drain();
  });
  pending = run.catch(() => undefined);
  return run;
}
