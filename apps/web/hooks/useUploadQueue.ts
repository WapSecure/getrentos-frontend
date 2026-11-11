'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UploadOptions } from '@/lib/apiHelpers';

export type UploadState =
  | { status: 'queued'; progress: 0 }
  | { status: 'uploading'; progress: number }
  | { status: 'failed'; progress: 0; error: string };

const isAbort = (error: unknown) => error instanceof Error && error.name === 'AbortError';

/**
 * Uploads files one request each, at most `concurrency` at a time, with progress, cancel and retry per file.
 * A failure only stops its own file: the rest carry on. Everything still running is cancelled on unmount.
 * Only files in the queue have a state; a finished upload leaves it and goes to `onSuccess`.
 */
export function useUploadQueue<R>({
  upload,
  onSuccess,
  concurrency = 3,
}: {
  upload: (file: File, options: UploadOptions) => Promise<R>;
  onSuccess: (id: string, result: R) => void;
  concurrency?: number;
}) {
  const [states, setStates] = useState<Record<string, UploadState>>({});
  const files = useRef(new Map<string, File>());
  const running = useRef(new Map<string, AbortController>());
  const waiting = useRef<string[]>([]);
  const handlers = useRef({ upload, onSuccess });
  useEffect(() => {
    handlers.current = { upload, onSuccess };
  });

  const setState = useCallback((id: string, state: UploadState | null) => {
    setStates((current) => {
      if (state === null) {
        if (!(id in current)) return current;
        const next = { ...current };
        delete next[id];
        return next;
      }
      const was = current[id];
      if (was && was.status === state.status && was.progress === state.progress) return current;
      return { ...current, [id]: state };
    });
  }, []);

  // A finished upload starts the next one through this ref: the callback cannot name itself.
  const next = useRef<() => void>(() => undefined);
  const pump = useCallback(() => {
    while (running.current.size < concurrency && waiting.current.length) {
      const id = waiting.current.shift()!;
      const file = files.current.get(id);
      if (!file) continue;
      const controller = new AbortController();
      running.current.set(id, controller);
      setState(id, { status: 'uploading', progress: 0 });
      handlers.current
        .upload(file, {
          signal: controller.signal,
          onProgress: (progress) =>
            !controller.signal.aborted && setState(id, { status: 'uploading', progress }),
        })
        .then(
          (result) => {
            if (controller.signal.aborted) return;
            files.current.delete(id);
            setState(id, null);
            handlers.current.onSuccess(id, result);
          },
          (error: unknown) => {
            if (controller.signal.aborted || isAbort(error)) return;
            const message =
              error instanceof Error && error.message
                ? error.message
                : 'This photo did not upload. Check your connection and try again.';
            setState(id, { status: 'failed', progress: 0, error: message });
          }
        )
        .finally(() => {
          if (running.current.get(id) === controller) running.current.delete(id);
          next.current();
        });
    }
  }, [concurrency, setState]);
  useEffect(() => {
    next.current = pump;
  }, [pump]);

  const add = useCallback(
    (items: { id: string; file: File }[]) => {
      items.forEach(({ id, file }) => {
        files.current.set(id, file);
        waiting.current.push(id);
        setState(id, { status: 'queued', progress: 0 });
      });
      pump();
    },
    [pump, setState]
  );

  /** Stops the file and forgets it. */
  const cancel = useCallback(
    (id: string) => {
      running.current.get(id)?.abort();
      running.current.delete(id);
      waiting.current = waiting.current.filter((w) => w !== id);
      files.current.delete(id);
      setState(id, null);
      pump();
    },
    [pump, setState]
  );

  const retry = useCallback(
    (id: string) => {
      if (!files.current.has(id) || running.current.has(id) || waiting.current.includes(id)) return;
      waiting.current.push(id);
      setState(id, { status: 'queued', progress: 0 });
      pump();
    },
    [pump, setState]
  );

  useEffect(() => {
    const active = running.current;
    return () => {
      waiting.current = [];
      active.forEach((controller) => controller.abort());
      active.clear();
    };
  }, []);

  const values = Object.values(states);
  return {
    states,
    add,
    cancel,
    retry,
    /** Files still queued or sending. */
    busy: values.some((s) => s.status !== 'failed'),
    failed: values.filter((s) => s.status === 'failed').length,
  };
}
