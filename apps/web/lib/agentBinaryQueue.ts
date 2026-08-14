export type AgentBinaryOperation = {
  id: string;
  type: 'document' | 'message';
  payload: Record<string, unknown>;
  files: File[];
  createdAt: string;
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
  files: File[]
) {
  const operation: AgentBinaryOperation = {
    id: crypto.randomUUID(),
    type,
    payload,
    files,
    createdAt: new Date().toISOString(),
  };
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(operation);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
  return operation;
}

export async function listAgentBinaryOperations(): Promise<AgentBinaryOperation[]> {
  const db = await openDatabase();
  const items = await new Promise<AgentBinaryOperation[]>((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return items;
}

export async function removeAgentBinaryOperation(id: string) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}
