'use client';

import { useState } from 'react';
import { Compass, ImageOff, Images, Play } from '@sureground/icons';
import { cn, type MediaItem } from '@sureground/shared';
import { MediaViewer } from './MediaViewer';

interface MediaMosaicProps {
  items: MediaItem[];
  title: string;
  emptyLabel?: string;
  className?: string;
}

const chip =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full bg-black/65 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

/** Cover plus four photos; every tile and chip opens the full-screen viewer at that item. */
export function MediaMosaic({
  items,
  title,
  emptyLabel = 'Photos are being prepared for this listing',
  className,
}: MediaMosaicProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const photos = items.filter((m) => m.kind === 'image');
  const videoAt = items.findIndex((m) => m.kind === 'video');
  const tourAt = items.findIndex((m) => m.kind === 'tour');

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted text-sm font-medium text-muted-foreground sm:h-[30rem]',
          className
        )}
      >
        <ImageOff className="h-6 w-6" aria-hidden="true" />
        {emptyLabel}
      </div>
    );
  }

  const tiles = (photos.length ? photos : items).slice(0, 5);
  const indexOf = (m: MediaItem) => items.indexOf(m);

  return (
    <>
      <div
        className={cn(
          'relative grid h-[22rem] gap-2 overflow-hidden rounded-2xl bg-muted shadow-sm sm:h-[31rem]',
          tiles.length > 1 && 'sm:grid-cols-4 sm:grid-rows-2',
          className
        )}
      >
        {tiles.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOpenAt(indexOf(m))}
            aria-label={
              i === 0 ? `Open gallery: ${m.alt ?? title}` : `Open ${m.alt ?? `photo ${i + 1}`}`
            }
            className={cn(
              'group relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
              i === 0 ? (tiles.length > 1 ? 'sm:col-span-2 sm:row-span-2' : '') : 'hidden sm:block'
            )}
          >
            <Tile item={m} eager={i === 0} />
          </button>
        ))}

        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-2">
          <div className="pointer-events-auto flex flex-wrap gap-2">
            {videoAt >= 0 && (
              <button type="button" onClick={() => setOpenAt(videoAt)} className={chip}>
                <Play className="h-3.5 w-3.5" aria-hidden="true" /> Video tour
              </button>
            )}
            {tourAt >= 0 && (
              <button type="button" onClick={() => setOpenAt(tourAt)} className={chip}>
                <Compass className="h-3.5 w-3.5" aria-hidden="true" /> 360 tour
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpenAt(0)}
            aria-label={photos.length > 1 ? `Show all ${photos.length} photos` : undefined}
            className={cn(chip, 'pointer-events-auto')}
          >
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            {photos.length > 1 ? (
              <>
                <span className="sm:hidden">{photos.length} photos</span>
                <span className="hidden sm:inline">Show all {photos.length} photos</span>
              </>
            ) : photos.length === 1 ? (
              '1 photo'
            ) : (
              'Open media'
            )}
          </button>
        </div>
      </div>

      <MediaViewer
        items={items}
        open={openAt !== null}
        startIndex={openAt ?? 0}
        onOpenChange={(open) => !open && setOpenAt(null)}
        title={title}
      />
    </>
  );
}

function Tile({ item, eager }: { item: MediaItem; eager: boolean }) {
  const [broken, setBroken] = useState(false);
  const src = item.kind === 'image' ? item.url : item.posterUrl;
  if (!src || broken) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
    <img
      src={src}
      alt=""
      width={item.width}
      height={item.height}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      onError={() => setBroken(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
    />
  );
}
