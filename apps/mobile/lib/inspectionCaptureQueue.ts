import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { ApiError } from './api/client';
import { landWatchApi } from './api/landWatch';

/**
 * Captures an inspector took in the field, waiting to upload.
 *
 * Land is often where the signal is not. A photo is copied into the app's own
 * documents folder (a camera file lives in a cache the OS may empty) and
 * queued with the time and place it was taken; the queue drains whenever the
 * connection is back. Each item carries a client reference, and the server
 * keeps one copy per reference or file hash, so a retry after a dropped
 * connection never files the same photo twice.
 *
 * A capture taken without a connection is marked `capturedOffline`; the server
 * flags one that syncs much later, so the owner's report is checked first.
 */

const KEY = 'getrentos.land.inspection-captures';
const DIR_NAME = 'inspection-captures';

export interface QueuedCapture {
  clientRef: string;
  inspectionId: string;
  uri: string;
  name: string;
  mimeType: string;
  capturedAt: string;
  lat?: number;
  lng?: number;
  capturedOffline: boolean;
  /** Set when the server refused it for good (e.g. the inspection closed). */
  error?: string;
}

let snapshot: QueuedCapture[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const emit = (next: QueuedCapture[]) => {
  snapshot = next;
  for (const l of listeners) l();
};

let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

async function read(): Promise<QueuedCapture[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QueuedCapture[]) : [];
  } catch {
    return [];
  }
}

async function write(items: QueuedCapture[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
  emit(items);
}

/** Loads the stored queue once, so the screen shows what survived a restart. */
export function loadCaptureQueue(): Promise<void> {
  if (loaded) return Promise.resolve();
  return serial(async () => {
    loaded = true;
    emit(await read());
  });
}

export function newClientRef(): string {
  return `cap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Keeps the photo somewhere the OS will not clear before it uploads. */
function persist(uri: string, clientRef: string, name: string): string {
  if (Platform.OS === 'web') return uri;
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '.jpg';
  const dest = new File(dir, `${clientRef}${ext}`);
  new File(uri).copy(dest);
  return dest.uri;
}

function forget(item: QueuedCapture) {
  if (Platform.OS === 'web') return;
  try {
    const f = new File(item.uri);
    if (f.exists) f.delete();
  } catch {
    // A file already gone is the outcome we wanted.
  }
}

export function enqueueCapture(
  capture: Omit<QueuedCapture, 'uri' | 'error'> & { sourceUri: string }
): Promise<void> {
  return serial(async () => {
    const { sourceUri, ...rest } = capture;
    const item: QueuedCapture = { ...rest, uri: persist(sourceUri, rest.clientRef, rest.name) };
    await write([...(await read()), item]);
  });
}

export function discardCapture(clientRef: string): Promise<void> {
  return serial(async () => {
    const items = await read();
    const gone = items.find((i) => i.clientRef === clientRef);
    if (gone) forget(gone);
    await write(items.filter((i) => i.clientRef !== clientRef));
  });
}

/**
 * Uploads what is waiting, oldest first. Stops at the first network failure
 * (the rest would fail too); a refusal for good is kept with its reason so
 * the inspector can see and discard it.
 */
export function flushCaptures(): Promise<{ uploaded: number; failed: number }> {
  return serial(async () => {
    let items = await read();
    let uploaded = 0;
    let failed = 0;
    for (const item of [...items]) {
      if (item.error) continue;
      try {
        await landWatchApi.uploadEvidence(
          item.inspectionId,
          { uri: item.uri, name: item.name, mimeType: item.mimeType },
          {
            capturedAt: item.capturedAt,
            lat: item.lat,
            lng: item.lng,
            capturedOffline: item.capturedOffline,
            clientRef: item.clientRef,
          }
        );
        forget(item);
        items = items.filter((i) => i.clientRef !== item.clientRef);
        uploaded += 1;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 408 &&
          error.status !== 429
        ) {
          items = items.map((i) =>
            i.clientRef === item.clientRef ? { ...i, error: error.message } : i
          );
          failed += 1;
          continue;
        }
        break;
      }
    }
    await write(items);
    return { uploaded, failed };
  });
}

export function useCaptureQueue(inspectionId?: string): QueuedCapture[] {
  const all = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
    () => snapshot
  );
  return inspectionId ? all.filter((i) => i.inspectionId === inspectionId) : all;
}
