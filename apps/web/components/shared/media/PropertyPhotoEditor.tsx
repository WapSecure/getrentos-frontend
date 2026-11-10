'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Star, X } from '@sureground/icons';
import { Input, Select } from '@sureground/ui';
import { MEDIA_ROOM_NAME, type MediaRoom } from '@sureground/shared';
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
}

const overlayButton =
  'rounded bg-black/70 p-1 text-white hover:bg-black/90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

export function PropertyPhotoEditor({
  photos,
  onChange,
  max = 12,
  emptyHint = 'Without a photo your listing card shows a placeholder instead of the property.',
}: PropertyPhotoEditorProps) {
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
    if (additions.length) onChange([...photos, ...additions]);
  };
  const update = (id: string, patch: Partial<Pick<EditablePhoto, 'room' | 'caption'>>) =>
    onChange(photos.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    [next[from], next[to]] = [next[to]!, next[from]!];
    onChange(next);
  };
  const makeCover = (index: number) =>
    onChange([photos[index]!, ...photos.filter((_, i) => i !== index)]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="space-y-2">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL or a local blob */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
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
                  onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
                  className={`${overlayButton} hover:bg-destructive`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="absolute bottom-1 right-1 flex gap-1">
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
    </div>
  );
}
