'use client';

import { useRef, useState } from 'react';
import type { MediaRoom } from '@sureground/shared/showroom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ImagePlus, Trash2 } from '@sureground/icons';
import { Button, IconButton, Progress } from '@sureground/ui';
import { useUploadQueue } from '@/hooks/useUploadQueue';
import { estateMarketplaceService } from '@/services/estateMarketplaceService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { EstateListing } from '@/types/estate-marketplace';
import { PhotoDetailFields } from '@/components/shared/media/PropertyPhotoEditor';

type Details = Record<string, { room?: MediaRoom; caption?: string }>;

const detailsOf = (listing: EstateListing): Details =>
  Object.fromEntries(
    (listing.media ?? []).map((m) => [m.key, { room: m.room, caption: m.caption }])
  );

// Must match MAX_LISTING_MEDIA on the server.
const MAX_PHOTOS = 12;

// Photos belong to the listing, not the property: the estate doesn't own the asset, so uploads never touch the owner's record.
export const ListingMediaPanel = ({
  estateId,
  listing,
}: {
  estateId: string;
  listing: EstateListing;
}) => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ text: string; failed: boolean } | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: estateKeys.estateListings(estateId) });
    void queryClient.invalidateQueries({ queryKey: estateKeys.inventory(estateId) });
  };

  // One request per photo, one at a time: the server checks the photo limit before it appends, so parallel sends
  // could overshoot it. Each success returns the listing with that photo in it.
  const [names, setNames] = useState<Record<string, string>>({});
  const uploads = useUploadQueue({
    concurrency: 1,
    upload: (file, options) =>
      unwrap(estateMarketplaceService.addListingMedia(estateId, listing.id, [file], options)),
    onSuccess: () => refresh(),
  });
  const uploadIds = Object.keys(uploads.states);

  const remove = useMutation({
    mutationFn: (key: string) =>
      unwrap(estateMarketplaceService.removeListingMedia(estateId, listing.id, key)),
    onSuccess: () => {
      refresh();
      setStatus({ text: 'Photo removed.', failed: false });
    },
    onError: (error: Error) =>
      setStatus({ text: error.message || 'Could not remove that photo.', failed: true }),
  });

  const [details, setDetails] = useState<Details>(() => detailsOf(listing));
  const [detailsDirty, setDetailsDirty] = useState(false);
  const saveDetails = useMutation({
    mutationFn: () => {
      const payload = Object.fromEntries(
        (listing.media ?? []).flatMap((m) => {
          const room = details[m.key]?.room;
          const caption = details[m.key]?.caption?.trim();
          return room || caption
            ? [[m.key, { ...(room ? { room } : {}), ...(caption ? { caption } : {}) }]]
            : [];
        })
      );
      return unwrap(
        estateMarketplaceService.updateListingMediaDetails(
          estateId,
          listing.id,
          Object.keys(payload).length ? payload : null
        )
      );
    },
    onSuccess: () => {
      setDetailsDirty(false);
      refresh();
      setStatus({ text: 'Photo details saved.', failed: false });
    },
    onError: (error: Error) =>
      setStatus({ text: error.message || 'Could not save the photo details.', failed: true }),
  });

  const media = listing.media ?? [];
  const busy = remove.isPending || saveDetails.isPending;
  const atCap = media.length + uploadIds.length >= MAX_PHOTOS;

  const pick = (files: FileList | null) => {
    if (!files?.length) return;
    setStatus(null);
    const room = Math.max(0, MAX_PHOTOS - media.length - uploadIds.length);
    const items = Array.from(files)
      .slice(0, room)
      .map((file, i) => ({ id: `${Date.now()}-${i}-${file.name}`, file }));
    setNames((current) => ({
      ...current,
      ...Object.fromEntries(items.map(({ id, file }) => [id, file.name])),
    }));
    uploads.add(items);
    // Reset so choosing the same file twice still fires a change event.
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            Your photos{' '}
            <span className="font-normal text-muted-foreground">
              ({media.length}/{MAX_PHOTOS})
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            These belong to this listing. The owner&apos;s own property photos are never changed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            id={`listing-media-${listing.id}`}
            onChange={(event) => pick(event.target.files)}
          />
          <Button
            variant="outline"
            icon={<ImagePlus className="w-4 h-4" />}
            onClick={() => inputRef.current?.click()}
            disabled={busy || atCap}
          >
            {atCap ? 'Limit reached' : 'Add photos'}
          </Button>
        </div>
      </div>

      {uploadIds.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Photo uploads">
          {uploadIds.map((id) => {
            const state = uploads.states[id]!;
            const name = names[id] ?? 'Photo';
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
              >
                {state.status === 'failed' ? (
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{name} did not upload</span>
                    </p>
                    <p className="line-clamp-2 text-2xs text-muted-foreground">{state.error}</p>
                  </div>
                ) : (
                  <Progress
                    className="min-w-0 flex-1"
                    size="sm"
                    value={state.progress}
                    label={
                      state.status === 'queued'
                        ? `${name}: waiting`
                        : state.progress >= 100
                          ? `${name}: processing`
                          : name
                    }
                    showValue="percent"
                  />
                )}
                <div className="flex shrink-0 gap-1">
                  {state.status === 'failed' && (
                    <Button size="xs" variant="primary" onClick={() => uploads.retry(id)}>
                      Retry
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => uploads.cancel(id)}
                    aria-label={`${state.status === 'failed' ? 'Remove' : 'Cancel upload of'} ${name}`}
                  >
                    {state.status === 'failed' ? 'Remove' : 'Cancel'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {media.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {listing.coverImageUrl
            ? 'No photos from you yet, so this listing is showing the property owner’s image.'
            : 'No photos from you yet, and the property has none of its own: this listing has no image.'}
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {media.map((photo, index) => (
            <div key={photo.key} className="relative space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Listing photo ${index + 1}`}
                className="aspect-video w-full rounded-lg object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-2xs font-medium text-white">
                  Cover
                </span>
              )}
              <IconButton
                label={`Remove photo ${index + 1}`}
                icon={<Trash2 />}
                size="sm"
                disabled={busy}
                isLoading={remove.isPending && remove.variables === photo.key}
                onClick={() => {
                  setStatus(null);
                  remove.mutate(photo.key);
                }}
                className="absolute -right-1.5 -top-1.5 h-6 w-6 rounded-full bg-background text-foreground shadow ring-1 ring-border hover:text-destructive [&_svg]:h-3.5 [&_svg]:w-3.5"
              />
              <PhotoDetailFields
                index={index}
                room={details[photo.key]?.room}
                caption={details[photo.key]?.caption}
                onChange={(patch) => {
                  setDetails((current) => ({
                    ...current,
                    [photo.key]: { ...current[photo.key], ...patch },
                  }));
                  setDetailsDirty(true);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {media.length > 0 && (
        <div className="mt-3 flex justify-end">
          <Button
            variant={detailsDirty ? 'primary' : 'outline'}
            size="sm"
            disabled={!detailsDirty || busy}
            isLoading={saveDetails.isPending}
            onClick={() => {
              setStatus(null);
              saveDetails.mutate();
            }}
          >
            Save photo details
          </Button>
        </div>
      )}

      {atCap && (
        <p className="mt-2 text-xs text-muted-foreground">
          This listing is at the {MAX_PHOTOS}-photo limit. Remove one to add another.
        </p>
      )}

      {status && (
        <p
          role={status.failed ? 'alert' : 'status'}
          className={`mt-2 text-xs ${status.failed ? 'text-destructive' : 'text-primary'}`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
};
