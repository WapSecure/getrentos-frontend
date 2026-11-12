'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  ImageOff,
  Layers,
  LayoutGrid,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
  Video,
  X,
} from '@sureground/icons';
import {
  cn,
  FLOOR_PLAN_MEASUREMENT_LABEL,
  floorPlanFor,
  floorPlanLevels,
  isFloorPlan,
  MEDIA_ROOM_LABEL,
  MEDIA_ROOM_NAME,
  placeholderOf,
  roomSizeLabel,
  srcSetOf,
  variantAtLeast,
  type MediaItem,
  type MediaRoom,
  type ShowroomFloorPlan,
  type ShowroomFloorPlanRoom,
} from '@sureground/shared';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './Dialog';
import { ProgressiveImg } from './ProgressiveImg';
import { TourEmbed } from './TourEmbed';
import { VideoPlayer } from './VideoPlayer';

export interface MediaEvent {
  type: 'gallery_open' | 'media_category_select' | 'video_start' | 'video_complete' | 'tour_start';
  mediaIndex?: number;
  room?: MediaRoom;
}

interface MediaViewerProps {
  items: MediaItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Index into `items` to show first. */
  startIndex?: number;
  title: string;
  /** For measurement; the viewer itself never sends anything. */
  onMediaEvent?: (event: MediaEvent) => void;
  /**
   * Structured floor plans, from `floorPlansOf`. A plan photo with one shows its rooms, sizes and
   * tap targets; without, the Floor plans tab shows the image alone, as before.
   */
  floorPlans?: ShowroomFloorPlan[];
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
  onMediaEvent,
  floorPlans,
}: MediaViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && items.length > 0 && (
        <DialogContent size="full" showClose={false} closeOnOutsideClick={false}>
          <ViewerBody
            items={items}
            startIndex={clamp(startIndex, 0, items.length - 1)}
            title={title}
            onMediaEvent={onMediaEvent}
            floorPlans={floorPlans}
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
  onMediaEvent,
  floorPlans,
}: {
  items: MediaItem[];
  startIndex: number;
  title: string;
  onMediaEvent?: (event: MediaEvent) => void;
  floorPlans?: ShowroomFloorPlan[];
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

  // Floor plans are a tab of their own, one level per plan, named by the lister's caption.
  const levels = useMemo(() => floorPlanLevels(items), [items]);
  const levelAt = levels.findIndex((l) => l.index === index);
  const onPlan = levelAt >= 0;
  // The lister's rooms and sizes for this level, when they added them.
  const plan = onPlan ? floorPlanFor(floorPlans, item.id) : undefined;
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const indexById = useMemo(() => new Map(items.map((m, i) => [m.id, i])), [items]);

  const go = (next: number) => {
    setIndex(((next % items.length) + items.length) % items.length);
    setZoom({ scale: 1, x: 0, y: 0 });
    setGrid(false);
    setActiveRoom(null);
  };

  // A room with a photo opens it; one without is highlighted on the plan and in the list.
  const openRoom = (room: ShowroomFloorPlanRoom) => {
    const at = room.photoMediaId ? indexById.get(room.photoMediaId) : undefined;
    if (at === undefined) {
      setActiveRoom(room.id);
      return;
    }
    go(at);
    const photoRoom = items[at]?.room;
    onMediaEvent?.({
      type: 'media_category_select',
      mediaIndex: at,
      ...(photoRoom ? { room: photoRoom } : {}),
    });
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

  const openFloorPlans = () => {
    const first = levels[0]!.index;
    go(first);
    onMediaEvent?.({ type: 'media_category_select', room: 'floor_plan', mediaIndex: first });
  };

  // A plan is named by its level ("Ground floor"), as the lister wrote it.
  const roomName = onPlan
    ? levels[levelAt]!.label
    : item.room && item.room !== 'other'
      ? MEDIA_ROOM_NAME[item.room]
      : null;
  const announced = onPlan && item.caption?.trim() ? `Floor plan, ${roomName}` : roomName;
  const position = `${kindLabel(item)} ${index + 1} of ${items.length}${announced ? ` · ${announced}` : ''}`;

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className="flex h-full min-h-0 flex-col bg-black">
      <header className="flex items-center gap-3 px-[max(1rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate text-sm font-semibold text-white">{title}</DialogTitle>
          <DialogDescription className="text-xs text-white/70" aria-live="polite">
            {position}
          </DialogDescription>
        </div>
        {/* Phones and tablets have no room rail, so floor plans get a button of their own. */}
        {levels.length > 0 && !onPlan && (
          <button
            type="button"
            onClick={openFloorPlans}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
          >
            <Layers className="h-4 w-4" aria-hidden="true" /> Floor plans
          </button>
        )}
        <DialogClose className={control} aria-label="Close gallery">
          <X className="h-5 w-5" aria-hidden="true" />
        </DialogClose>
      </header>

      <div
        className={cn(
          'relative flex min-h-0 flex-1 gap-4 px-[max(1rem,env(safe-area-inset-left))]',
          plan && !grid && 'flex-col gap-3 lg:flex-row lg:gap-4'
        )}
      >
        <div
          className={cn(
            'relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl',
            // Line drawings read on a light page; photos stay on the dark stage.
            onPlan && !grid ? 'bg-white' : 'bg-white/5'
          )}
        >
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
                  isImage && 'touch-none select-none',
                  // Room for the level chips (top-3 plus a 52px bar), so they never cover the plan.
                  onPlan && levels.length > 1 && 'pt-18'
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
                    onStart={() => onMediaEvent?.({ type: 'video_start', mediaIndex: index })}
                    onComplete={() => onMediaEvent?.({ type: 'video_complete', mediaIndex: index })}
                  />
                ) : item.kind === 'tour' ? (
                  <TourEmbed
                    key={item.id}
                    url={item.url}
                    title={`${title}, 360 tour`}
                    className="max-h-full"
                    onOpen={() => onMediaEvent?.({ type: 'tour_start', mediaIndex: index })}
                  />
                ) : failed.has(item.id) ? (
                  <div className="flex flex-col items-center gap-2 text-sm text-white/70">
                    <ImageOff className="h-8 w-8" aria-hidden="true" />
                    This photo couldn’t load.
                  </div>
                ) : plan ? (
                  <PlanStage
                    key={item.id}
                    item={item}
                    plan={plan}
                    zoom={zoom}
                    animate={!dragging}
                    activeRoom={activeRoom}
                    onRoom={openRoom}
                    onError={() => setFailed((s) => new Set(s).add(item.id))}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
                  <img
                    key={item.id}
                    src={item.url}
                    srcSet={srcSetOf(item.variants)}
                    sizes="100vw"
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
                      // Drawn where the photo will be (same shape, centred) and covered once it loads.
                      ...placeholderBackdrop(item.placeholder),
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

          {roomName && isImage && !grid && (
            <p className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-black/55 px-3 py-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {roomName}
            </p>
          )}
          {onPlan && levels.length > 1 && !grid && (
            <nav
              aria-label="Floor plan levels"
              className="absolute inset-x-3 top-3 flex justify-center"
            >
              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-black/70 p-1">
                <button
                  type="button"
                  onClick={() => go(levels[levelAt - 1]!.index)}
                  disabled={levelAt === 0}
                  className={cn(control, 'shrink-0')}
                  aria-label="Previous level"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {levels.map((level, i) => (
                  <button
                    key={level.index}
                    type="button"
                    onClick={() => go(level.index)}
                    aria-current={i === levelAt ? 'true' : undefined}
                    className={cn(
                      'min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      i === levelAt ? 'bg-white text-black' : 'text-white hover:bg-white/15'
                    )}
                  >
                    {level.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => go(levels[levelAt + 1]!.index)}
                  disabled={levelAt === levels.length - 1}
                  className={cn(control, 'shrink-0')}
                  aria-label="Next level"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
          {(item.caption || item.filmedOnSite) && !onPlan && !grid && (
            <p className="pointer-events-none absolute left-4 top-4 max-w-[70%] rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
              {item.caption}
              {item.caption && item.filmedOnSite ? ' · ' : ''}
              {item.filmedOnSite &&
                `Filmed on site${item.capturedAt ? `, ${new Date(item.capturedAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}` : ''}`}
            </p>
          )}
        </div>

        {plan && !grid && (
          <PlanRooms
            plan={plan}
            activeRoom={activeRoom}
            onRoom={openRoom}
            className="max-h-[34%] shrink-0 lg:max-h-none lg:w-72"
          />
        )}

        {(rooms.length > 1 || levels.length > 0) && !(plan && !grid) && (
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
                  onClick={() => {
                    go(first);
                    onMediaEvent?.({ type: 'media_category_select', room, mediaIndex: first });
                  }}
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

const placeholderBackdrop = (placeholder?: string) => {
  const blur = placeholderOf(placeholder);
  return blur
    ? {
        backgroundImage: `url("${blur}")`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {};
};

function Thumb({ item, load = true }: { item: MediaItem; load?: boolean }) {
  const [broken, setBroken] = useState(false);
  const src = load
    ? item.kind === 'image'
      ? variantAtLeast(item.url, item.variants, 320)
      : item.posterUrl
    : undefined;
  const blur = item.kind === 'image' ? placeholderOf(item.placeholder) : undefined;
  if (!load && blur) {
    return (
      <span
        className="block h-full w-full bg-cover bg-center"
        style={{ backgroundImage: `url("${blur}")` }}
        aria-hidden="true"
      />
    );
  }
  return (
    <>
      {src && !broken ? (
        <ProgressiveImg
          src={src}
          alt=""
          placeholder={blur}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          // A plan is never cropped, even as a thumbnail.
          className={cn(
            'h-full w-full',
            isFloorPlan(item) ? 'bg-white object-contain' : 'object-cover'
          )}
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

const PLAN_NOTE = {
  estimated: 'Sizes are the lister’s estimates. Check them at your viewing.',
  checked: 'Sizes measured, checked by Sureground.',
} as const;

/**
 * A plan image with its rooms' tap targets. The box is sized to the drawing itself (not the
 * stage), so a target at 30% across sits 30% across the plan whatever the screen.
 */
function PlanStage({
  item,
  plan,
  zoom,
  animate,
  activeRoom,
  onRoom,
  onError,
}: {
  item: MediaItem;
  plan: ShowroomFloorPlan;
  zoom: { scale: number; x: number; y: number };
  animate: boolean;
  activeRoom: string | null;
  onRoom: (room: ShowroomFloorPlanRoom) => void;
  onError: () => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(
    item.width && item.height ? { w: item.width, h: item.height } : null
  );

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => setArea({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fit =
    natural && area && area.w > 0 && area.h > 0
      ? Math.min(area.w / natural.w, area.h / natural.h)
      : null;
  const targets = plan.rooms
    .map((room, i) => ({ room, number: i + 1 }))
    .filter(({ room }) => room.x !== undefined && room.y !== undefined);

  return (
    <div ref={areaRef} className="flex h-full w-full items-center justify-center">
      <div
        className={cn(
          'relative',
          !fit && 'max-h-full max-w-full',
          animate && 'transition-transform duration-200 motion-reduce:transition-none'
        )}
        style={{
          ...(fit && natural ? { width: natural.w * fit, height: natural.h * fit } : {}),
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
        <img
          src={item.url}
          srcSet={srcSetOf(item.variants)}
          sizes="100vw"
          alt={item.alt ?? ''}
          width={item.width}
          height={item.height}
          draggable={false}
          onLoad={(event) => {
            const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
            if (w > 0 && h > 0 && !natural) setNatural({ w, h });
          }}
          onError={onError}
          className={cn('block object-contain', fit ? 'h-full w-full' : 'max-h-full max-w-full')}
          style={placeholderBackdrop(item.placeholder)}
        />
        {fit &&
          targets.map(({ room, number }) => (
            <button
              key={room.id}
              type="button"
              // The stage swipes and zooms on pointer events; a tap here is a room, not a swipe.
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onRoom(room)}
              aria-label={`${number}. ${room.name}${room.photoMediaId ? ', open its photo' : ''}`}
              className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ left: `${room.x}%`, top: `${room.y}%` }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow ring-2 ring-white',
                  activeRoom === room.id
                    ? 'bg-black text-white'
                    : 'bg-primary text-primary-foreground'
                )}
              >
                {number}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

/** The level's rooms. Every size carries its label; there is no total area. */
function PlanRooms({
  plan,
  activeRoom,
  onRoom,
  className,
}: {
  plan: ShowroomFloorPlan;
  activeRoom: string | null;
  onRoom: (room: ShowroomFloorPlanRoom) => void;
  className?: string;
}) {
  const sized = plan.rooms.some((r) => r.widthM !== undefined && r.lengthM !== undefined);
  return (
    <section
      aria-label={`Rooms on ${plan.levelName}`}
      className={cn(
        'flex min-h-0 flex-col gap-2 overflow-y-auto rounded-2xl bg-white/10 p-3 text-white',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Rooms</h3>
        {sized && (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
              plan.measurement === 'checked' ? 'bg-white text-black' : 'bg-white/15 text-white'
            )}
          >
            {FLOOR_PLAN_MEASUREMENT_LABEL[plan.measurement]}
          </span>
        )}
      </div>
      {sized && <p className="text-xs text-white/70">{PLAN_NOTE[plan.measurement]}</p>}
      {plan.rooms.length === 0 ? (
        <p className="text-sm text-white/70">The lister has not named the rooms on this level.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {plan.rooms.map((room, i) => {
            const size = roomSizeLabel(room, plan.measurement);
            const actionable =
              !!room.photoMediaId || (room.x !== undefined && room.y !== undefined);
            const body = (
              <>
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{room.name}</span>
                  <span className="block text-xs text-white/70">{size ?? 'No size given'}</span>
                </span>
                {room.photoMediaId && (
                  <span className="flex shrink-0 items-center gap-0.5 self-center text-xs font-semibold text-white/80">
                    Photo <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </>
            );
            return (
              <li key={room.id}>
                {actionable ? (
                  <button
                    type="button"
                    onClick={() => onRoom(room)}
                    aria-current={activeRoom === room.id ? 'true' : undefined}
                    aria-label={`${i + 1}. ${room.name}${size ? `, ${size}` : ''}${room.photoMediaId ? ', open its photo' : ''}`}
                    className={cn(
                      'flex min-h-11 w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      activeRoom === room.id && 'bg-white/15'
                    )}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex min-h-11 items-start gap-2 px-2 py-1.5">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
