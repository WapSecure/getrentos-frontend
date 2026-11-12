import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './api/client';
import type { PickedFile } from './api/documents';
import {
  createUploadQueue,
  uploadsBusy,
  uploadsFailed,
  type UploadQueue,
  type UploadState,
  type UploadTaskOptions,
} from './uploadQueue';

export interface PendingPhoto {
  id: string;
  file: PickedFile;
}

let nextId = 0;

/**
 * New photos for a property: each uploads as soon as it is picked, up to 3 at a time, with progress,
 * cancel and retry. Once nothing is left sending, the photos that made it are attached in one go, in the
 * order they were picked; failed ones wait for Retry or Remove without holding the others back.
 */
export function usePhotoUploads({
  upload,
  attach,
}: {
  upload: (file: PickedFile, options: UploadTaskOptions) => Promise<string>;
  /** Adds the storage keys to the property. A rejection puts those photos back as failed. */
  attach: (keys: string[]) => Promise<void>;
}) {
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [states, setStates] = useState<Record<string, UploadState>>({});
  const [attaching, setAttaching] = useState(false);
  const pendingRef = useRef(pending);
  const uploaded = useRef(new Map<string, string>());
  const handlers = useRef({ upload, attach });
  useEffect(() => {
    handlers.current = { upload, attach };
    pendingRef.current = pending;
  });

  // Made on first use rather than in render, so a remount after an unmount gets a live queue.
  const queueRef = useRef<UploadQueue<PickedFile, string> | null>(null);
  const queue = useCallback(() => {
    if (!queueRef.current) {
      queueRef.current = createUploadQueue<PickedFile, string>({
        upload: (file, options) => handlers.current.upload(file, options),
        onSuccess: (id, key) => void uploaded.current.set(id, key),
        onChange: setStates,
      });
    }
    return queueRef.current;
  }, []);
  useEffect(
    () => () => {
      // Photos uploaded but not attached are left to the server's clean-up of unattached uploads.
      queueRef.current?.dispose();
      queueRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (attaching || uploadsBusy(states) || !uploaded.current.size) return;
    const batch = pendingRef.current.filter((p) => uploaded.current.has(p.id));
    const keys = batch.map((p) => uploaded.current.get(p.id)!);
    uploaded.current.clear();
    if (!batch.length) return;
    setAttaching(true);
    handlers.current
      .attach(keys)
      .then(
        () => {
          const done = new Set(batch.map((p) => p.id));
          setPending((current) => current.filter((p) => !done.has(p.id)));
        },
        (e: unknown) => {
          const message = errorMessage(e, 'Could not add this photo to the property.');
          batch.forEach((p) => queue().fail(p.id, p.file, message));
        }
      )
      .finally(() => setAttaching(false));
  }, [states, attaching, queue]);

  const add = useCallback(
    (files: PickedFile[]) => {
      const items = files.map((file) => ({ id: `photo-${++nextId}`, file }));
      if (!items.length) return;
      setPending((current) => [...current, ...items]);
      queue().add(items);
    },
    [queue]
  );

  const remove = useCallback(
    (id: string) => {
      queue().cancel(id);
      uploaded.current.delete(id);
      setPending((current) => current.filter((p) => p.id !== id));
    },
    [queue]
  );

  const retry = useCallback((id: string) => queue().retry(id), [queue]);

  return {
    pending,
    states,
    add,
    remove,
    retry,
    /** True until every photo is attached or has failed: changes to the saved photos wait for this. */
    busy: attaching || pending.some((p) => states[p.id]?.status !== 'failed'),
    failed: uploadsFailed(states),
  };
}
