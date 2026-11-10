'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  ImageOff,
  LayoutGrid,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
  Video,
  X,
} from '@sureground/icons';
import { cn, MEDIA_ROOM_LABEL, type MediaItem, type MediaRoom } from '@sureground/shared';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './Dialog';
import { TourEmbed } from './TourEmbed';
import { VideoPlayer } from './VideoPlayer';

interface MediaViewerProps {
  items: MediaItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Index into `items` to show first. */
  startIndex?: number;
  title: string;
}

const MAX_ZOOM = 4;
const SWIPE_PX = 50;
const SLIDE_MS = 4000;
// Thumbnails are full-size photos until resized versions exist, so the strip only fetches nearby ones.
const THUMB_WINDOW = 4;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const control =
  'flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40 disabled:hover:bg-transparent';

const kindLabel = (item: MediaItem) =>
  item.kind === 'video' ? 'Video tour' : item.kind === 'tour' ? '360 tour' : 'Photo';

export function MediaViewer({
  items,
  open,
  onOpenChange,
  startIndex = 0,
  title,
}: MediaViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && items.length > 0 && (
        <DialogContent size="full" showClose={false} closeOnOutsideClick={false}>
          <ViewerBody
            items={items}
            startIndex={clamp(startIndex, 0, items.length - 1)}
            title={title}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function ViewerBody({
  items,
  startIndex,
  title,
}: {
  items: MediaItem[];
  startIndex: number;
  title: string;
}) {
  const [index, setIndex] = useState(startIndex);
  const [grid, setGrid] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startX: number;
    startY: number;
    dist: number;
    scale: number;
    x: number;
    y: number;
  } | null>(null);
  const lastTap = useRef(0);

  const item = items[index]!;
  const isImage = item.kind === 'image';
  const zoomed = zoom.scale > 1;

  const rooms = useMemo(() => {
    const seen = new Map<MediaRoom, number>();
    items.forEach((m, i) => {
      if (m.room && !seen.has(m.room)) seen.set(m.room, i);
    });
    return [...seen.entries()];
  }, [items]);

  const go = (next: number) => {
    setIndex(((next % items.length) + items.length) % items.length);
    setZoom({ scale: 1, x: 0, y: 0 });
    setGrid(false);
  };

  useEffect(() => {
    thumbsRef.current
      ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
    // Warm the neighbours so the next swipe shows a photo, not a blank.
    for (const n of [index - 1, index + 1]) {
      const m = items[(n + items.length) % items.length];
      if (m?.kind === 'image') new Image().src = m.url;
    }
  }, [index, items]);

  // Videos and tours pause the slideshow: they need the viewer's attention, not a timer.
  const sliding = playing && isImage;
  useEffect(() => {
    if (!sliding) return;
    const t = window.setTimeout(() => go(index + 1), SLIDE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliding, index]);

  const zoomTo = (scale: number) =>
    setZoom((z) =>
      scale <= 1 ? { scale: 1, x: 0, y: 0 } : { ...z, scale: clamp(scale, 1, MAX_ZOOM) }
    );

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLElement && event.target.closest('iframe, video')) return;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => go(index - 1),
      ArrowRight: () => go(index + 1),
      Home: () => go(0),
      End: () => go(items.length - 1),
      '+': () => isImage && zoomTo(zoom.scale + 0.5),
      '=': () => isImage && zoomTo(zoom.scale + 0.5),
      '-': () => isImage && zoomTo(zoom.scale - 0.5),
      '0': () => zoomTo(1),
    };
    const run = keys[event.key];
    if (run) {
      event.preventDefault();
      run();
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isImage) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pts = [...pointers.current.values()];
    const dist = pts.length === 2 ? Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) : 0;
    gesture.current = {
      startX: event.clientX,
      startY: event.clientY,
      dist,
      scale: zoom.scale,
      x: zoom.x,
      y: zoom.y,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && g.dist > 0) {
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      zoomTo(g.scale * (dist / g.dist));
    } else if (pts.length === 1 && zoomed) {
      setZoom((z) => ({
        ...z,
        x: g.x + (event.clientX - g.startX),
        y: g.y + (event.clientY - g.startY),
      }));
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    const wasPinch = pointers.current.size > 1;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) setDragging(false);
    if (!g || wasPinch || pointers.current.size > 0) return;
    gesture.current = null;
    const dx = event.clientX - g.startX;
    const dy = event.clientY - g.startY;
    if (!zoomed && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      go(index + (dx < 0 ? 1 : -1));
      return;
    }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      const now = Date.now();
      if (now - lastTap.current < 300) zoomTo(zoomed ? 1 : 2.5);
      lastTap.current = now;
    }
  };

  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    // Optional: some phones and in-app browsers don't offer it; the viewer already fills the window.
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void el.requestFullscreen?.().catch(() => {});
  };

  const position = `${kindLabel(item)} ${index + 1} of ${items.length}`;

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className="flex h-full min-h-0 flex-col bg-black">
      <header className="flex items-center gap-3 px-[max(1rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate text-sm font-semibold text-white">{title}</DialogTitle>
          <DialogDescription className="text-xs text-white/70" aria-live="polite">
            {position}
          </DialogDescription>
        </div>
        <DialogClose className={control} aria-label="Close gallery">
          <X className="h-5 w-5" aria-hidden="true" />
        </DialogClose>
      </header>

      <div className="relative flex min-h-0 flex-1 gap-4 px-[max(1rem,env(safe-area-inset-left))]">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl bg-white/5">
          {grid ? (
            <ul
              className="grid h-full auto-rows-[8rem] grid-cols-2 gap-2 overflow-y-auto p-2 sm:grid-cols-3 lg:grid-cols-4"
              aria-label="All media"
            >
              {items.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    className="relative h-full w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={`${kindLabel(m)} ${i + 1}${m.caption ? `: ${m.caption}` : ''}`}
                  >
                    <Thumb item={m} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center',
                  isImage && 'touch-none select-none'
                )}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={(event) => {
                  if (isImage && event.ctrlKey) zoomTo(zoom.scale - event.deltaY * 0.01);
                }}
              >
                {item.kind === 'video' ? (
                  <VideoPlayer
                    key={item.id}
                    src={item.url}
                    poster={item.posterUrl}
                    title={`${title}, video tour`}
                    className="max-h-full"
                  />
                ) : item.kind === 'tour' ? (
                  <TourEmbed
                    key={item.id}
                    url={item.url}
                    title={`${title}, 360 tour`}
                    className="max-h-full"
                  />
                ) : failed.has(item.id) ? (
                  <div className="flex flex-col items-center gap-2 text-sm text-white/70">
                    <ImageOff className="h-8 w-8" aria-hidden="true" />
                    This photo couldn’t load.
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
                  <img
                    key={item.id}
                    src={item.url}
                    alt={item.alt ?? ''}
                    width={item.width}
                    height={item.height}
                    draggable={false}
                    onError={() => setFailed((s) => new Set(s).add(item.id))}
                    className={cn(
                      'max-h-full max-w-full object-contain',
                      !dragging && 'transition-transform duration-200 motion-reduce:transition-none'
                    )}
                    style={{
                      transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                    }}
                  />
                )}
              </div>

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(index - 1)}
                    className={cn(control, 'absolute left-3 top-1/2 -translate-y-1/2 bg-black/50')}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(index + 1)}
                    className={cn(control, 'absolute right-3 top-1/2 -translate-y-1/2 bg-black/50')}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              )}
            </>
          )}

          {(item.caption || item.filmedOnSite) && !grid && (
            <p className="pointer-events-none absolute left-4 top-4 max-w-[70%] rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
              {item.caption}
              {item.caption && item.filmedOnSite ? ' · ' : ''}
              {item.filmedOnSite &&
                `Filmed on site${item.capturedAt ? `, ${new Date(item.capturedAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}` : ''}`}
            </p>
          )}
        </div>

        {rooms.length > 1 && (
          <nav
            aria-label="Rooms"
            className="hidden w-44 shrink-0 flex-col gap-2 overflow-y-auto pb-2 lg:flex"
          >
            {rooms.map(([room, first]) => {
              const current = item.room === room;
              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => go(first)}
                  aria-current={current ? 'true' : undefined}
                  className={cn(
                    'relative h-28 shrink-0 overflow-hidden rounded-xl text-left ring-2 focus:outline-none focus-visible:ring-white',
                    current ? 'ring-primary' : 'ring-transparent'
                  )}
                >
                  <Thumb item={items[first]!} />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-1.5 text-sm font-semibold text-white">
                    {MEDIA_ROOM_LABEL[room]}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      <footer className="flex flex-col items-center gap-3 px-[max(1rem,env(safe-area-inset-left))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div
          role="toolbar"
          aria-label="Gallery controls"
          className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"
        >
          <button
            type="button"
            onClick={() => setGrid((g) => !g)}
            aria-pressed={grid}
            className={control}
            aria-label="Show all media"
          >
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={items.length < 2}
            className={control}
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={items.length < 2 || !isImage}
            aria-pressed={sliding}
            className={control}
            aria-label={sliding ? 'Pause slideshow' : 'Play slideshow'}
          >
            {sliding ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={items.length < 2}
            className={control}
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="mx-1 h-6 w-px bg-white/20" aria-hidden="true" />
          <button
            type="button"
            onClick={() => zoomTo(zoom.scale - 0.5)}
            disabled={!isImage || !zoomed}
            className={control}
            aria-label="Zoom out"
          >
            <Minus className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => zoomTo(zoom.scale + 0.5)}
            disabled={!isImage || zoom.scale >= MAX_ZOOM}
            className={control}
            aria-label="Zoom in"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={cn(control, 'hidden sm:flex')}
            aria-label="Full screen"
          >
            <Maximize2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {items.length > 1 && (
          <div
            ref={thumbsRef}
            className="flex w-full max-w-4xl gap-2 overflow-x-auto pb-1"
            aria-label="Thumbnails"
          >
            {items.map((m, i) => (
              <button
                key={m.id}
                type="button"
                data-index={i}
                onClick={() => go(i)}
                aria-current={i === index ? 'true' : undefined}
                aria-label={`${kindLabel(m)} ${i + 1}`}
                className={cn(
                  'relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 focus:outline-none focus-visible:ring-white sm:h-16 sm:w-24',
                  i === index ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100'
                )}
              >
                <Thumb item={m} load={Math.abs(i - index) <= THUMB_WINDOW} />
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}

function Thumb({ item, load = true }: { item: MediaItem; load?: boolean }) {
  const [broken, setBroken] = useState(false);
  const src = load ? (item.kind === 'image' ? item.url : item.posterUrl) : undefined;
  return (
    <>
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-white/10 text-white/70">
          {item.kind === 'video' ? (
            <Video className="h-5 w-5" />
          ) : item.kind === 'tour' ? (
            <Compass className="h-5 w-5" />
          ) : load ? (
            <ImageOff className="h-5 w-5" />
          ) : null}
        </span>
      )}
      {item.kind !== 'image' && src && !broken && (
        <span
          className="absolute inset-0 flex items-center justify-center bg-black/30 text-white"
          aria-hidden="true"
        >
          {item.kind === 'video' ? <Play className="h-5 w-5" /> : <Compass className="h-5 w-5" />}
        </span>
      )}
    </>
  );
}
