export type UploadState =
  | { status: 'queued'; progress: 0 }
  | { status: 'uploading'; progress: number }
  | { status: 'failed'; progress: 0; error: string };

export interface UploadTaskOptions {
  /** Whole percent sent, 0 to 100. At 100 the server may still be working. */
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}

export interface UploadQueueOptions<F, R> {
  upload: (file: F, options: UploadTaskOptions) => Promise<R>;
  onSuccess: (id: string, result: R) => void;
  /** Called with a fresh object after every change. */
  onChange: (states: Record<string, UploadState>) => void;
  concurrency?: number;
}

export const UPLOAD_FALLBACK_ERROR =
  'This photo did not upload. Check your connection and try again.';

const isAbort = (error: unknown) => error instanceof Error && error.name === 'AbortError';

/**
 * Uploads files one request each, at most `concurrency` at a time, with progress, cancel and retry per file.
 * A failure only stops its own file: the rest carry on. Only files in the queue have a state; a finished
 * upload leaves it and goes to `onSuccess`. Plain TypeScript so the rules can be tested without React.
 */
export function createUploadQueue<F, R>({
  upload,
  onSuccess,
  onChange,
  concurrency = 3,
}: UploadQueueOptions<F, R>) {
  let states: Record<string, UploadState> = {};
  const files = new Map<string, F>();
  const running = new Map<string, AbortController>();
  let waiting: string[] = [];
  let disposed = false;

  const setState = (id: string, state: UploadState | null) => {
    if (disposed) return;
    const was = states[id];
    if (state === null) {
      if (!was) return;
      const next = { ...states };
      delete next[id];
      states = next;
    } else {
      if (was && was.status === state.status && was.progress === state.progress) return;
      states = { ...states, [id]: state };
    }
    onChange(states);
  };

  const pump = () => {
    while (!disposed && running.size < concurrency && waiting.length) {
      const id = waiting.shift()!;
      const file = files.get(id);
      if (file === undefined) continue;
      const controller = new AbortController();
      running.set(id, controller);
      setState(id, { status: 'uploading', progress: 0 });
      let task: Promise<R>;
      try {
        task = upload(file, {
          signal: controller.signal,
          onProgress: (progress) => {
            if (!controller.signal.aborted) setState(id, { status: 'uploading', progress });
          },
        });
      } catch (error) {
        task = Promise.reject(error);
      }
      task
        .then(
          (result) => {
            if (controller.signal.aborted || disposed) return;
            files.delete(id);
            // Before the state clears, so a listener that sees the queue go quiet also sees the result.
            onSuccess(id, result);
            setState(id, null);
          },
          (error: unknown) => {
            if (controller.signal.aborted || isAbort(error)) return;
            const message =
              error instanceof Error && error.message ? error.message : UPLOAD_FALLBACK_ERROR;
            setState(id, { status: 'failed', progress: 0, error: message });
          }
        )
        .finally(() => {
          if (running.get(id) === controller) running.delete(id);
          pump();
        });
    }
  };

  return {
    states: () => states,
    add(items: { id: string; file: F }[]) {
      items.forEach(({ id, file }) => {
        files.set(id, file);
        waiting.push(id);
        setState(id, { status: 'queued', progress: 0 });
      });
      pump();
    },
    /** Stops the file and forgets it. */
    cancel(id: string) {
      running.get(id)?.abort();
      running.delete(id);
      waiting = waiting.filter((w) => w !== id);
      files.delete(id);
      setState(id, null);
      pump();
    },
    /** Sends a failed file again. */
    retry(id: string) {
      if (!files.has(id) || running.has(id) || waiting.includes(id)) return;
      waiting.push(id);
      setState(id, { status: 'queued', progress: 0 });
      pump();
    },
    /** Puts a file that uploaded back in the queue as failed, e.g. when attaching it did not work. */
    fail(id: string, file: F, error: string) {
      files.set(id, file);
      setState(id, { status: 'failed', progress: 0, error });
    },
    /** Cancels everything; the queue does nothing after this. */
    dispose() {
      disposed = true;
      waiting = [];
      running.forEach((controller) => controller.abort());
      running.clear();
      files.clear();
    },
  };
}

export type UploadQueue<F, R> = ReturnType<typeof createUploadQueue<F, R>>;

/** Files still queued or sending. */
export const uploadsBusy = (states: Record<string, UploadState>) =>
  Object.values(states).some((s) => s.status !== 'failed');

export const uploadsFailed = (states: Record<string, UploadState>) =>
  Object.values(states).filter((s) => s.status === 'failed').length;
