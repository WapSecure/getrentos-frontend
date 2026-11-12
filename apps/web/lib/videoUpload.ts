import { ApiError, authFetch, authUpload, type UploadOptions } from '@/lib/apiHelpers';
import {
  StorageUploadError,
  missingParts,
  partRange,
  putToStorage,
  retryDelayMs,
  videoContentType,
  type StorageUploadSession,
} from '@/lib/storageUpload';

/** Files above this go up in resumable parts; smaller ones in one request. */
const RESUMABLE_FROM_BYTES = 10 * 1024 * 1024;
const PART_ATTEMPTS = 3;
const SIGN_BATCH = 10;

export interface UploadedVideo {
  key: string;
  kind: 'video';
}

/**
 * Uploads a video straight to storage. Big files go up in resumable 8 MB parts (a dropped connection loses one part;
 * after a reload the same file picks up where it stopped); small ones in one request. `basePath` is the owning
 * route, e.g. `/landlord/properties`. Falls back to older routes when the API does not offer the newer ones.
 */
export async function uploadVideoDirect(
  basePath: string,
  file: File,
  upload?: UploadOptions
): Promise<UploadedVideo> {
  if (file.size > RESUMABLE_FROM_BYTES) {
    const resumable = await uploadVideoInParts(basePath, file, upload);
    if (resumable) return resumable;
  }
  return uploadVideoSingle(basePath, file, upload);
}

interface ResumeState {
  key: string;
  uploadId: string;
  partSize: number;
  partCount: number;
}

/** Same file, same route: the browser remembers its unfinished upload. */
const resumeId = (basePath: string, file: File) =>
  `sg.video-upload:${basePath}:${file.name}:${file.size}:${file.lastModified}`;

function readResume(id: string): ResumeState | null {
  try {
    const raw = localStorage.getItem(id);
    return raw ? (JSON.parse(raw) as ResumeState) : null;
  } catch {
    return null;
  }
}

function writeResume(id: string, state: ResumeState | null): void {
  try {
    if (state) localStorage.setItem(id, JSON.stringify(state));
    else localStorage.removeItem(id);
  } catch {
    // Without storage the upload still works; it just cannot resume after a reload.
  }
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('The upload was cancelled.', 'AbortError'));
      },
      { once: true }
    );
  });

/** Null when the API has no resumable uploads (the caller then uses the single-request upload). */
async function uploadVideoInParts(
  basePath: string,
  file: File,
  upload?: UploadOptions
): Promise<UploadedVideo | null> {
  const route = `${basePath}/media/video-upload/multipart`;
  const call = <T>(action: string, body: Record<string, unknown>) =>
    authFetch<T>(`${route}/${action}`, { method: 'POST', body: JSON.stringify(body) });
  const id = resumeId(basePath, file);

  let state = readResume(id);
  let uploaded: number[] = [];
  if (state) {
    try {
      const status = await call<{ partCount: number; uploaded: number[] }>('status', {
        key: state.key,
        uploadId: state.uploadId,
      });
      uploaded = status.uploaded;
    } catch {
      // Finished, expired or cleaned up: start again.
      state = null;
      writeResume(id, null);
    }
  }
  if (!state) {
    try {
      state = await call<ResumeState>('start', {
        filename: file.name,
        contentType: videoContentType(file),
        sizeBytes: file.size,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
    writeResume(id, state);
  }

  const { key, uploadId, partSize, partCount } = state;
  const sent = new Map<number, number>(
    uploaded.map((n) => [
      n,
      partRange(file.size, partSize, n).end - partRange(file.size, partSize, n).start,
    ])
  );
  const report = () => {
    const bytes = [...sent.values()].reduce((a, b) => a + b, 0);
    upload?.onProgress?.(Math.min(99, Math.floor((bytes / file.size) * 100)));
  };
  report();

  const todo = missingParts(partCount, uploaded);
  for (let i = 0; i < todo.length; i += SIGN_BATCH) {
    const batch = todo.slice(i, i + SIGN_BATCH);
    const { parts } = await call<{ parts: { partNumber: number; url: string }[] }>('parts', {
      key,
      uploadId,
      partNumbers: batch,
    });
    for (const part of parts) {
      const { start, end } = partRange(file.size, partSize, part.partNumber);
      const blob = file.slice(start, end);
      for (let attempt = 1; ; attempt++) {
        try {
          await putToStorage({ uploadUrl: part.url }, blob, {
            signal: upload?.signal,
            onProgress: (percent) => {
              sent.set(part.partNumber, ((end - start) * percent) / 100);
              report();
            },
          });
          sent.set(part.partNumber, end - start);
          report();
          break;
        } catch (error) {
          if ((error as Error).name === 'AbortError') throw error;
          if (attempt >= PART_ATTEMPTS) {
            // The parts already sent stay; picking the same file again resumes from here.
            if (error instanceof StorageUploadError)
              throw new ApiError(error.status, error.message);
            throw error;
          }
          await wait(retryDelayMs(attempt), upload?.signal);
        }
      }
    }
  }

  const result = await call<UploadedVideo>('complete', { key, uploadId });
  writeResume(id, null);
  upload?.onProgress?.(100);
  return result;
}

/** One request: the API signs a link for its own key, the browser PUTs the file, then the API checks it. */
async function uploadVideoSingle(
  basePath: string,
  file: File,
  upload?: UploadOptions
): Promise<UploadedVideo> {
  let session: StorageUploadSession;
  try {
    session = await authFetch<StorageUploadSession>(`${basePath}/media/video-upload`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: videoContentType(file),
        sizeBytes: file.size,
      }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const form = new FormData();
      form.append('kind', 'video');
      form.append('file', file);
      const path = `${basePath}/media/upload`;
      const legacy = upload
        ? await authUpload<{ key: string }>(path, form, upload)
        : await authFetch<{ key: string }>(path, { method: 'POST', body: form });
      return { key: legacy.key, kind: 'video' };
    }
    throw error;
  }
  try {
    await putToStorage(session, file, upload);
  } catch (error) {
    // Same error type as every other API failure, so callers show it the same way.
    if (error instanceof StorageUploadError) throw new ApiError(error.status, error.message);
    throw error;
  }
  return authFetch<UploadedVideo>(`${basePath}/media/video-upload/complete`, {
    method: 'POST',
    body: JSON.stringify({ key: session.key }),
  });
}
