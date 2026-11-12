import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import {
  abortError,
  ApiError,
  apiFetch,
  apiUploadWithProgress,
  sendWithProgress,
  type UploadProgressOptions,
} from './client';
import { appendFile, type PickedFile } from './documents';

interface VideoUploadSession {
  key: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

export interface UploadedVideo {
  key: string;
  kind: 'video';
}

const TYPE_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  webm: 'video/webm',
};

/** Pickers often report no type (or a generic one) for camera recordings, so the extension decides. */
export function videoContentType(file: PickedFile): string {
  const declared = (file.mimeType ?? '').toLowerCase();
  if (declared === 'video/mp4' || declared === 'video/quicktime' || declared === 'video/webm')
    return declared;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXTENSION[ext] ?? (declared || 'video/mp4');
}

type Progress = (fraction: number) => void;

const stopIfCancelled = (signal?: AbortSignal) => {
  if (signal?.aborted) throw abortError();
};

/** Streams the file from disk on iOS/Android, so a 150 MB video is never held in memory. */
async function putFile(
  session: VideoUploadSession,
  file: PickedFile,
  webBlob: Blob | null,
  onProgress?: Progress,
  signal?: AbortSignal
): Promise<void> {
  if (webBlob) {
    // XHR rather than fetch, for progress in the browser too.
    const res = await sendWithProgress('PUT', session.uploadUrl, webBlob, session.headers, {
      onProgress: (percent) => onProgress?.(percent / 100),
      signal,
    });
    if (!res.ok) throw new Error(`Video upload failed (${res.status})`);
    onProgress?.(1);
    return;
  }
  const result = await new File(file.uri).upload(session.uploadUrl, {
    httpMethod: 'PUT',
    headers: session.headers,
    signal,
    onProgress: ({ bytesSent, totalBytes }) => {
      if (totalBytes > 0) onProgress?.(bytesSent / totalBytes);
    },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Video upload failed (${result.status})`);
  }
}

/** Files above this go up in resumable 8 MB parts on iOS and Android. */
const RESUMABLE_FROM_BYTES = 10 * 1024 * 1024;
const PART_ATTEMPTS = 3;
const SIGN_BATCH = 10;

/** Wait before retry `attempt`: 1 s, 2 s, 4 s… capped at 8 s, so a weak network gets breathing room. */
export const retryDelayMs = (attempt: number) => Math.min(8000, 1000 * 2 ** (attempt - 1));

/** Part numbers 1..count that storage does not hold yet. */
export function missingParts(count: number, uploaded: readonly number[]): number[] {
  const have = new Set(uploaded);
  return Array.from({ length: count }, (_, i) => i + 1).filter((n) => !have.has(n));
}

interface ResumeState {
  key: string;
  uploadId: string;
  partSize: number;
  partCount: number;
}

const resumeId = (basePath: string, file: PickedFile, size: number) =>
  `sg.video-upload:${basePath}:${file.uri}:${size}`;

/**
 * Resumable upload in parts, read from disk one part at a time (never the whole video in memory). A dropped
 * connection loses one part; the next attempt with the same file asks which parts arrived and sends the rest.
 * Null when the API has no resumable uploads.
 */
async function uploadVideoInParts(
  basePath: string,
  file: PickedFile,
  size: number,
  onProgress?: Progress,
  signal?: AbortSignal
): Promise<UploadedVideo | null> {
  const route = `${basePath}/media/video-upload/multipart`;
  const call = <T>(action: string, body: Record<string, unknown>) =>
    apiFetch<T>(`${route}/${action}`, { method: 'POST', body });
  const id = resumeId(basePath, file, size);

  let state: ResumeState | null = null;
  let uploaded: number[] = [];
  try {
    const raw = await AsyncStorage.getItem(id);
    state = raw ? (JSON.parse(raw) as ResumeState) : null;
  } catch {
    state = null;
  }
  if (state) {
    try {
      uploaded = (
        await call<{ uploaded: number[] }>('status', { key: state.key, uploadId: state.uploadId })
      ).uploaded;
    } catch {
      state = null;
      await AsyncStorage.removeItem(id).catch(() => undefined);
    }
  }
  if (!state) {
    try {
      state = await call<ResumeState>('start', {
        filename: file.name,
        contentType: videoContentType(file),
        sizeBytes: size,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
    await AsyncStorage.setItem(id, JSON.stringify(state)).catch(() => undefined);
  }

  const { key, uploadId, partSize, partCount } = state;
  const lengthOf = (n: number) => Math.min(partSize, size - (n - 1) * partSize);
  let sentBytes = uploaded.reduce((sum, n) => sum + lengthOf(n), 0);
  onProgress?.(sentBytes / size);

  const handle = new File(file.uri).open();
  try {
    const todo = missingParts(partCount, uploaded);
    for (let i = 0; i < todo.length; i += SIGN_BATCH) {
      const { parts } = await call<{ parts: { partNumber: number; url: string }[] }>('parts', {
        key,
        uploadId,
        partNumbers: todo.slice(i, i + SIGN_BATCH),
      });
      for (const part of parts) {
        stopIfCancelled(signal);
        handle.offset = (part.partNumber - 1) * partSize;
        const bytes = await handle.readBytes(lengthOf(part.partNumber));
        for (let attempt = 1; ; attempt++) {
          try {
            const res = await expoFetch(part.url, { method: 'PUT', body: bytes, signal });
            if (!res.ok) throw new Error(`Video upload failed (${res.status})`);
            break;
          } catch (error) {
            // The parts already sent stay; trying the same file again resumes from here.
            stopIfCancelled(signal);
            if (attempt >= PART_ATTEMPTS) throw error;
            await new Promise((r) => setTimeout(r, retryDelayMs(attempt)));
          }
        }
        sentBytes += bytes.length;
        onProgress?.(Math.min(0.99, sentBytes / size));
      }
    }
  } finally {
    handle.close();
  }

  stopIfCancelled(signal);
  const result = await call<UploadedVideo>('complete', { key, uploadId });
  await AsyncStorage.removeItem(id).catch(() => undefined);
  onProgress?.(1);
  return result;
}

/**
 * Uploads a video straight to storage: big files in resumable parts (iOS and Android), others in one request:
 * the API signs a short-lived link for its own key, the file goes to storage, then the API checks it.
 * `basePath` is the owning route, e.g. `/landlord/properties`. Falls back to older routes when the API lacks them.
 * Progress is in whole percent, as for photos; 100 means sent, while storage and the API may still be checking it.
 * Cancelling rejects with an `AbortError`; a resumable upload keeps its sent parts for the next try.
 */
export async function uploadVideoDirect(
  basePath: string,
  file: PickedFile,
  { onProgress, signal }: UploadProgressOptions = {}
): Promise<UploadedVideo> {
  let last = -1;
  const report: Progress = (fraction) => {
    const percent = Math.max(0, Math.min(100, Math.floor(fraction * 100)));
    if (percent !== last) onProgress?.((last = percent));
  };
  stopIfCancelled(signal);
  if (Platform.OS !== 'web') {
    const size = new File(file.uri).size ?? 0;
    if (size > RESUMABLE_FROM_BYTES) {
      const resumable = await uploadVideoInParts(basePath, file, size, report, signal);
      if (resumable) return resumable;
    }
  }
  const contentType = videoContentType(file);
  // In the browser the picked file is a blob URL: read it once, for its size and for the upload.
  const webBlob = Platform.OS === 'web' ? await (await fetch(file.uri)).blob() : null;
  const sizeBytes = webBlob ? webBlob.size : (new File(file.uri).size ?? 0);
  let session: VideoUploadSession;
  try {
    session = await apiFetch<VideoUploadSession>(`${basePath}/media/video-upload`, {
      method: 'POST',
      body: { filename: file.name, contentType, sizeBytes },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const form = new FormData();
      appendFile(form, 'file', file);
      form.append('kind', 'video');
      const legacy = await apiUploadWithProgress<{ key: string }>(
        `${basePath}/media/upload`,
        form,
        { onProgress, signal }
      );
      return { key: legacy.key, kind: 'video' };
    }
    throw error;
  }
  stopIfCancelled(signal);
  await putFile(session, file, webBlob, report, signal);
  stopIfCancelled(signal);
  return apiFetch<UploadedVideo>(`${basePath}/media/video-upload/complete`, {
    method: 'POST',
    body: { key: session.key },
  });
}
