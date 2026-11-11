// No imports, so the unit tests can load it directly.

export interface StorageUploadSession {
  key: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

export interface StorageUploadOptions {
  /** Whole percent sent, 0 to 100. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/** Storage refused or could not be reached; `status` is 0 for a network failure. */
export class StorageUploadError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'StorageUploadError';
    this.status = status;
  }
}

const TYPE_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  webm: 'video/webm',
};

/** Browsers sometimes give an empty or generic type for camera files, so the extension decides then. */
export function videoContentType(file: { name: string; type: string }): string {
  const declared = file.type.toLowerCase();
  if (declared === 'video/mp4' || declared === 'video/quicktime' || declared === 'video/webm')
    return declared;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXTENSION[ext] ?? (declared || 'video/mp4');
}

const abortError = () => new DOMException('The upload was cancelled.', 'AbortError');

/** A PUT to the signed storage link, over XHR for progress and cancel. No cookies or extra headers: only what was signed. */
export function putToStorage(
  session: StorageUploadSession,
  file: Blob,
  { onProgress, signal }: StorageUploadOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', session.uploadUrl);
    Object.entries(session.headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    let last = -1;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const percent = Math.min(100, Math.floor((event.loaded / event.total) * 100));
      if (percent !== last) onProgress((last = percent));
    };
    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const done = () => signal?.removeEventListener('abort', onAbort);
    xhr.onabort = () => {
      done();
      reject(abortError());
    };
    xhr.onerror = () => {
      done();
      reject(
        new StorageUploadError(
          0,
          'The video could not be uploaded. Please check your connection and try again.'
        )
      );
    };
    xhr.onload = () => {
      done();
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new StorageUploadError(xhr.status, 'The video could not be uploaded. Please try again.')
        );
    };
    xhr.send(file);
  });
}
