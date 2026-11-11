'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, ImagePlus, Star, X } from '@sureground/icons';
import { Button, Input, Progress, Select } from '@sureground/ui';
import { MEDIA_ROOM_NAME, type MediaRoom } from '@sureground/shared';
import type { UploadOptions } from '@/lib/apiHelpers';
import { useUploadQueue, type UploadState } from '@/hooks/useUploadQueue';
import type { PropertyMediaDetails } from '@/types/landlord';

export type EditablePhoto = {
  id: string;
  /** Storage key once uploaded; new photos have a `file` instead. */
  key?: string;
  url: string;
  file?: File;
  room?: MediaRoom;
  caption?: string;
};

const CAPTION_MAX = 140;
const ROOM_OPTIONS = [
  { value: '', label: 'Room (optional)' },
  ...(Object.keys(MEDIA_ROOM_NAME) as MediaRoom[]).map((room) => ({
    value: room,
    label: MEDIA_ROOM_NAME[room],
  })),
];

/** Cover first, then the rest, as the API orders the keys. */
export const photosFromKeys = (
  keys: string[],
  urls: string[],
  details?: PropertyMediaDetails | null
): EditablePhoto[] =>
  keys.map((key, index) => ({
    id: key,
    key,
    url: urls[index] ?? '',
    room: details?.[key]?.room,
    caption: details?.[key]?.caption,
  }));

/** `keys[i]` is the uploaded key of `photos[i]`. Returns null when nothing is tagged, which clears the map. */
export const mediaDetailsFor = (
  photos: EditablePhoto[],
  keys: (string | undefined)[]
): PropertyMediaDetails | null => {
  const entries = photos.flatMap((photo, i) => {
    const key = keys[i];
    const caption = photo.caption?.trim();
    if (!key || (!photo.room && !caption)) return [];
    return [
      [key, { ...(photo.room ? { room: photo.room } : {}), ...(caption ? { caption } : {}) }],
    ];
  });
  return entries.length ? Object.fromEntries(entries) : null;
};

/** True while any new photo is still uploading or has failed: its key is not known yet. */
export const photosPending = (photos: EditablePhoto[]) => photos.some((p) => p.file && !p.key);

/** Room and caption inputs for one photo; also used where photos save one by one. */
export function PhotoDetailFields({
  index,
  room,
  caption,
  onChange,
}: {
  index: number;
  room?: MediaRoom;
  caption?: string;
  onChange: (patch: { room?: MediaRoom; caption?: string }) => void;
}) {
  return (
    <>
      <Select
        value={room ?? ''}
        onValueChange={(value) => onChange({ room: (value || undefined) as MediaRoom | undefined })}
        options={ROOM_OPTIONS}
        ariaLabel={`Room for photo ${index + 1}`}
      />
      <Input
        type="text"
        value={caption ?? ''}
        maxLength={CAPTION_MAX}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Caption (optional)"
        aria-label={`Caption for photo ${index + 1}`}
      />
    </>
  );
}

interface PropertyPhotoEditorProps {
  photos: EditablePhoto[];
  onChange: (next: EditablePhoto[]) => void;
  max?: number;
  /** Shown when there are no photos. */
  emptyHint?: string;
  /**
   * Uploads one photo and returns its storage key. When given, new photos upload as soon as they are added, each with
   * progress, cancel and retry, and get their `key` when done; until then `photosPending` is true.
   */
  upload?: (file: File, options: UploadOptions) => Promise<string>;
}

const overlayButton =
  'rounded bg-black/70 p-1 text-white hover:bg-black/90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

export function PropertyPhotoEditor({
  photos,
  onChange,
  max = 12,
  emptyHint = 'Without a photo your listing card shows a placeholder instead of the property.',
  upload,
}: PropertyPhotoEditorProps) {
  // Uploads finish after the render that started them, so they patch the newest list, never a stale one.
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  const commit = (next: EditablePhoto[]) => {
    latest.current = next;
    onChange(next);
  };
  const uploads = useUploadQueue<string>({
    upload: (file, options) =>
      upload ? upload(file, options) : Promise.reject(new Error('Uploads are off')),
    onSuccess: (id, key) => commit(latest.current.map((p) => (p.id === id ? { ...p, key } : p))),
  });

  const objectUrls = useRef<string[]>([]);
  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
    },
    []
  );

  const add = (files: FileList | null) => {
    if (!files?.length) return;
    const additions = Array.from(files)
      .slice(0, Math.max(0, max - photos.length))
      .map((file): EditablePhoto => {
        const url = URL.createObjectURL(file);
        objectUrls.current.push(url);
        return { id: `${file.name}-${file.lastModified}-${url}`, url, file };
      });
    if (!additions.length) return;
    commit([...photos, ...additions]);
    if (upload) uploads.add(additions.map((p) => ({ id: p.id, file: p.file! })));
  };
  const update = (id: string, patch: Partial<Pick<EditablePhoto, 'room' | 'caption'>>) =>
    commit(photos.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    [next[from], next[to]] = [next[to]!, next[from]!];
    commit(next);
  };
  const makeCover = (index: number) =>
    commit([photos[index]!, ...photos.filter((_, i) => i !== index)]);
  const remove = (id: string) => {
    uploads.cancel(id);
    commit(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="space-y-2">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL or a local blob */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
              {uploads.states[photo.id] && (
                <UploadOverlay
                  index={index}
                  state={uploads.states[photo.id]!}
                  onCancel={() => remove(photo.id)}
                  onRetry={() => uploads.retry(photo.id)}
                />
              )}
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-2xs font-medium text-white">
                  Cover
                </span>
              )}
              <div className="absolute right-1 top-1 flex gap-1">
                {index !== 0 && (
                  <button
                    type="button"
                    aria-label={`Make photo ${index + 1} the cover`}
                    onClick={() => makeCover(index)}
                    className={overlayButton}
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => remove(photo.id)}
                  className={`${overlayButton} hover:bg-destructive`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {/* The upload bar sits where these are until the photo is in. */}
              <div
                className={`absolute bottom-1 right-1 flex gap-1 ${uploads.states[photo.id] ? 'hidden' : ''}`}
              >
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  className={overlayButton}
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} later`}
                  disabled={index === photos.length - 1}
                  onClick={() => move(index, index + 1)}
                  className={overlayButton}
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
            <PhotoDetailFields
              index={index}
              room={photo.room}
              caption={photo.caption}
              onChange={(patch) => update(photo.id, patch)}
            />
          </div>
        ))}

        {photos.length < max && (
          <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-within:ring-2 focus-within:ring-ring">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                add(event.target.files);
                event.target.value = '';
              }}
            />
            <ImagePlus className="h-4 w-4" />
            <span className="text-2xs">Add photos</span>
          </label>
        )}
      </div>

      {photos.length === 0 && <p className="text-xs text-warning">{emptyHint}</p>}
      {uploads.failed > 0 && (
        <p role="alert" className="text-xs text-destructive">
          {uploads.failed === 1
            ? '1 photo did not upload. Retry it or remove it to save.'
            : `${uploads.failed} photos did not upload. Retry them or remove them to save.`}
        </p>
      )}
    </div>
  );
}

/** Over a photo while it uploads: progress with cancel, or the failure with retry. */
function UploadOverlay({
  index,
  state,
  onCancel,
  onRetry,
}: {
  index: number;
  state: UploadState;
  onCancel: () => void;
  onRetry: () => void;
}) {
  if (state.status === 'failed') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 p-3 text-center">
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Upload failed
        </p>
        <p className="line-clamp-2 text-2xs text-muted-foreground">{state.error}</p>
        <div className="flex gap-2">
          <Button size="xs" variant="primary" onClick={onRetry}>
            Retry
          </Button>
          <Button size="xs" variant="outline" onClick={onCancel}>
            Remove
          </Button>
        </div>
      </div>
    );
  }
  const label =
    state.status === 'queued'
      ? 'Waiting to upload'
      : state.progress >= 100
        ? 'Processing'
        : 'Uploading';
  return (
    <div className="absolute inset-x-1 bottom-1 flex items-end gap-2 rounded-md bg-card/95 p-2 shadow-sm">
      <Progress
        value={state.progress}
        label={label}
        showValue="percent"
        size="sm"
        className="min-w-0 flex-1"
      />
      <Button
        size="xs"
        variant="ghost"
        onClick={onCancel}
        aria-label={`Cancel upload of photo ${index + 1}`}
      >
        Cancel
      </Button>
    </div>
  );
}
