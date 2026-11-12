'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Layers } from '@sureground/icons';
import { Button } from '@sureground/ui/Button';
import { MediaMosaic } from '@sureground/ui/MediaMosaic';
import { type MediaEvent } from '@sureground/ui/MediaViewer';
import type {
  MediaItem,
  ShowroomEventMarket,
  ShowroomFloorPlan,
  ShowroomMarket,
} from '@sureground/shared/showroom';
import { track } from '@/lib/analytics';

export function TrackDetailView({
  listingId,
  market,
}: {
  listingId: string;
  market: ShowroomMarket;
}) {
  useEffect(() => {
    track({ name: 'property_detail_view', listingId, market, surface: 'listing_page' });
  }, [listingId, market]);
  return null;
}

type GalleryState = { openIndex: number | null; setOpenIndex: (index: number | null) => void };
const GalleryContext = createContext<GalleryState | null>(null);

/** Shares the viewer between the mosaic and buttons further down the page (the floor plans shortcut). */
export function ShowroomGallery({ children }: { children: ReactNode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <GalleryContext.Provider value={{ openIndex, setOpenIndex }}>
      {children}
    </GalleryContext.Provider>
  );
}

/** Opens the viewer on the first floor plan. A plan is only an image, so this claims no sizes. */
export function FloorPlansShortcut({
  listingId,
  market,
  firstIndex,
  count,
}: {
  listingId: string;
  market: ShowroomEventMarket;
  /** Index into the listing's media of its first floor plan. */
  firstIndex: number;
  count: number;
}) {
  const gallery = useContext(GalleryContext);
  if (!gallery) return null;
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<Layers className="h-4 w-4" />}
      onClick={() => {
        const props = { mediaIndex: firstIndex };
        track({ name: 'gallery_open', listingId, market, surface: 'listing_page', props });
        track({
          name: 'media_category_select',
          listingId,
          market,
          surface: 'listing_page',
          props: { ...props, room: 'floor_plan' },
        });
        gallery.setOpenIndex(firstIndex);
      }}
    >
      {count > 1 ? `Floor plans (${count})` : 'Floor plan'}
    </Button>
  );
}

/** The page is a server component, so the media callbacks live in this client island. */
export function ShowroomMedia({
  listingId,
  market,
  items,
  title,
  className,
  floorPlans,
}: {
  listingId: string;
  market: ShowroomEventMarket;
  items: MediaItem[];
  title: string;
  className?: string;
  floorPlans?: ShowroomFloorPlan[];
}) {
  const gallery = useContext(GalleryContext);
  const onMediaEvent = ({ type, mediaIndex, room }: MediaEvent) =>
    track({
      name: type,
      listingId,
      market,
      surface: 'listing_page',
      props: { ...(mediaIndex !== undefined ? { mediaIndex } : {}), ...(room ? { room } : {}) },
    });
  return (
    <MediaMosaic
      items={items}
      title={title}
      className={className}
      onMediaEvent={onMediaEvent}
      floorPlans={floorPlans}
      {...(gallery
        ? { openIndex: gallery.openIndex, onOpenIndexChange: gallery.setOpenIndex }
        : {})}
    />
  );
}
