'use client';

import { useState } from 'react';
import { Compass, ImageOff, Images, Play } from '@sureground/icons';
import {
  cn,
  MEDIA_ROOM_LABEL,
  placeholderOf,
  srcSetOf,
  type MediaItem,
  type MediaRoom,
} from '@sureground/shared';
import { Button } from './Button';
import { MediaViewer, type MediaEvent } from './MediaViewer';
import { ProgressiveImg } from './ProgressiveImg';

interface MediaMosaicProps {
  items: MediaItem[];
  title: string;
  emptyLabel?: string;
  className?: string;
  onMediaEvent?: (event: MediaEvent) => void;
}

// Fills the 4×2 grid whatever the photo count, so no empty slot shows.
const tileSpan = (index: number, count: number) => {
  if (count < 2) return '';
  if (index === 0) return 'sm:col-span-2 sm:row-span-2';
  if (count === 2) return 'sm:col-span-2 sm:row-span-2';
  if (count === 3) return 'sm:col-span-2';
  if (count === 4 && index === 3) return 'sm:col-span-2';
  return '';
};

const chip =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full bg-black/65 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

/** Cover plus four photos; every tile and chip opens the full-screen viewer at that item. */
export function MediaMosaic({
  items,
  title,
  emptyLabel = 'Photos are being prepared for this listing',
  className,
  onMediaEvent,
}: MediaMosaicProps) {
  const [openAt, setOpenAtState] = useState<number | null>(null);
  const setOpenAt = (index: number | null) => {
    if (index !== null && openAt === null)
      onMediaEvent?.({ type: 'gallery_open', mediaIndex: index });
    setOpenAtState(index);
  };
  const [phoneAt, setPhoneAt] = useState(0);
  const photos = items.filter((m) => m.kind === 'image');
  const videoAt = items.findIndex((m) => m.kind === 'video');
  const tourAt = items.findIndex((m) => m.kind === 'tour');
  const rooms = new Map<MediaRoom, { first: number; count: number }>();
  items.forEach((m, i) => {
    if (!m.room || m.room === 'other') return;
    const seen = rooms.get(m.room);
    rooms.set(m.room, seen ? { ...seen, count: seen.count + 1 } : { first: i, count: 1 });
  });

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
        {/* Phones swipe through the photos in place; larger screens get the mosaic. */}
        <div
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const el = event.currentTarget;
            setPhoneAt(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
          }}
          aria-label="Photos"
        >
          {(photos.length ? photos : items).map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setOpenAt(indexOf(m))}
              aria-label={`Open ${m.alt ?? `photo ${i + 1}`}`}
              className="group relative h-full w-full shrink-0 snap-center overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
              <Tile item={m} eager={i === 0} load={Math.abs(i - phoneAt) <= 1} sizes="100vw" />
            </button>
          ))}
        </div>

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
              'hidden sm:block',
              tileSpan(i, tiles.length)
            )}
          >
            <Tile
              item={m}
              eager={i === 0}
              sizes={i === 0 ? '(min-width: 640px) 50vw, 100vw' : '25vw'}
            />
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
            onClick={() =>
              setOpenAt(photos.length ? indexOf(photos[Math.min(phoneAt, photos.length - 1)]!) : 0)
            }
            aria-label={photos.length > 1 ? `Show all ${photos.length} photos` : undefined}
            className={cn(chip, 'pointer-events-auto')}
          >
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            {photos.length > 1 ? (
              <>
                <span className="data-value sm:hidden">
                  {Math.min(phoneAt + 1, photos.length)} / {photos.length}
                </span>
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

      {rooms.size > 1 && (
        <nav aria-label="Photos by room" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {[...rooms].map(([room, { first, count }]) => (
            <Button
              key={room}
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => {
                setOpenAt(first);
                onMediaEvent?.({ type: 'media_category_select', room, mediaIndex: first });
              }}
            >
              {MEDIA_ROOM_LABEL[room]}
              <span className="data-value text-muted-foreground">{count}</span>
            </Button>
          ))}
        </nav>
      )}

      <MediaViewer
        items={items}
        open={openAt !== null}
        startIndex={openAt ?? 0}
        onOpenChange={(open) => !open && setOpenAt(null)}
        title={title}
        onMediaEvent={onMediaEvent}
      />
    </>
  );
}

// A phone slide not loaded yet still shows its blurred placeholder, when there is one.
const placeholderStyle = (item: MediaItem) => {
  const blur = item.kind === 'image' ? placeholderOf(item.placeholder) : undefined;
  return blur ? { backgroundImage: `url("${blur}")` } : undefined;
};

// `load={false}` keeps a plain tile: browsers fetch lazy images well before they scroll into view.
function Tile({
  item,
  eager,
  load = true,
  sizes,
}: {
  item: MediaItem;
  eager: boolean;
  load?: boolean;
  sizes?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = item.kind === 'image' ? item.url : item.posterUrl;
  if (!load)
    return (
      <span
        className="block h-full w-full bg-muted bg-cover bg-center"
        style={placeholderStyle(item)}
        aria-hidden="true"
      />
    );
  if (!src || broken) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </span>
    );
  }
  return (
    <ProgressiveImg
      src={src}
      srcSet={item.kind === 'image' ? srcSetOf(item.variants) : undefined}
      sizes={sizes}
      alt=""
      placeholder={item.kind === 'image' ? item.placeholder : undefined}
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
