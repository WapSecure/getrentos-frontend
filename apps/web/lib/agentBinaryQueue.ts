import { notifyAgentQueueChanged } from './agentQueueEvents';
import { currentAgentQueueOwner, requireAgentQueueOwner } from './agentQueueOwner';

export type AgentBinaryOperation = {
  id: string;
  type: 'document' | 'message';
  payload: Record<string, unknown>;
  files: File[];
  createdAt: string;
  ownerId?: string;
};

const DATABASE = 'getrentos-agent-offline';
const STORE = 'operations';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueAgentBinaryOperation(
  type: AgentBinaryOperation['type'],
  payload: Record<string, unknown>,
  files: File[],
  expectedOwner?: string
) {
  const operation: AgentBinaryOperation = {
    id: crypto.randomUUID(),
    type,
    payload,
    files,
    createdAt: new Date().toISOString(),
    ownerId: requireAgentQueueOwner(expectedOwner),
  };
  const db = await openDatabase();
  try {
    requireAgentQueueOwner(operation.ownerId);
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(operation);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('The document could not be saved on this device.'));
    });
  } finally {
    db.close();
  }
  notifyAgentQueueChanged();
  return operation;
}

async function readAllAgentBinaryOperations(): Promise<AgentBinaryOperation[]> {
  const db = await openDatabase();
  const items = await new Promise<AgentBinaryOperation[]>((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return items;
}

export async function listAgentBinaryOperations(
  ownerId = currentAgentQueueOwner()
): Promise<AgentBinaryOperation[]> {
  if (!ownerId) return [];
  requireAgentQueueOwner(ownerId);
  const items = await readAllAgentBinaryOperations();
  requireAgentQueueOwner(ownerId);
  return items.filter((item) => item.ownerId === ownerId);
}

export async function unownedAgentBinaryCount(): Promise<number> {
  return (await readAllAgentBinaryOperations()).filter((item) => !item.ownerId).length;
}

export async function removeAgentBinaryOperation(id: string, expectedOwner: string) {
  const db = await openDatabase();
  try {
    requireAgentQueueOwner(expectedOwner);
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      const read = store.get(id);
      read.onsuccess = () => {
        if (read.result?.ownerId === expectedOwner) store.delete(id);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('The upload queue could not be updated.'));
    });
  } finally {
    db.close();
  }
  notifyAgentQueueChanged();
}
