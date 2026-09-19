'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { estateMarketplaceService } from '@/services/estateMarketplaceService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { EstateListing } from '@/types/estate-marketplace';

/** Must match MAX_LISTING_MEDIA on the server, or the UI promises what the API refuses. */
const MAX_PHOTOS = 12;

/**
 * The estate's own photos for one of its listings.
 *
 * Photos hang off the LISTING, not the property: an estate is photographing an
 * asset it does not own, so anything uploaded here never touches the owner's
 * property record.
 *
 * When the estate has supplied none, the panel says so and explains what the
 * listing is showing instead. A manager looking at their own listing and seeing
 * someone else's photo has no way to know why — the property's cover is being
 * used as a fallback, and that is worth stating rather than leaving as a mystery.
 */
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

  const upload = useMutation({
    mutationFn: (files: File[]) =>
      unwrap(estateMarketplaceService.addListingMedia(estateId, listing.id, files)),
    onSuccess: () => {
      refresh();
      setStatus({ text: 'Photos added.', failed: false });
    },
    onError: (error: Error) =>
      setStatus({ text: error.message || 'Could not add those photos.', failed: true }),
  });

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

  const media = listing.media ?? [];
  const busy = upload.isPending || remove.isPending;
  const atCap = media.length >= MAX_PHOTOS;

  const pick = (files: FileList | null) => {
    if (!files?.length) return;
    setStatus(null);
    upload.mutate(Array.from(files));
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
            onClick={() => inputRef.current?.click()}
            disabled={busy || atCap}
          >
            {upload.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            {atCap ? 'Limit reached' : 'Add photos'}
          </Button>
        </div>
      </div>

      {media.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {listing.coverImageUrl
            ? 'No photos from you yet, so this listing is showing the property owner’s image.'
            : 'No photos from you yet, and the property has none of its own — this listing has no image.'}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((photo, index) => (
            <div key={photo.key} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Listing photo ${index + 1}`}
                className="h-20 w-24 rounded-lg object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                disabled={busy}
                onClick={() => {
                  setStatus(null);
                  remove.mutate(photo.key);
                }}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-1 shadow ring-1 ring-border transition-colors hover:text-red-600 disabled:opacity-40"
              >
                {remove.isPending && remove.variables === photo.key ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {atCap && (
        <p className="mt-2 text-xs text-muted-foreground">
          This listing is at the {MAX_PHOTOS}-photo limit. Remove one to add another.
        </p>
      )}

      {status && (
        <p className={`mt-2 text-xs ${status.failed ? 'text-red-600' : 'text-primary'}`}>
          {status.text}
        </p>
      )}
    </div>
  );
};
