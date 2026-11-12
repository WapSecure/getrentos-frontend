import { useEffect, useState } from 'react';
import type {
  MediaItem,
  ShowroomEventMarket,
  ShowroomFloorPlan,
} from '@sureground/shared/showroom';
import { trackShowroom } from '@/lib/showroomAnalytics';
import { MediaViewer, type MediaEvent } from './MediaViewer';
import { ShowroomHero } from './ShowroomHero';

interface HeroViewerProps {
  items: MediaItem[];
  title: string;
  height?: number;
  area?: string | null;
  emptyLabel?: string;
  onVideoExpired?: () => void;
  floorPlans?: ShowroomFloorPlan[];
}

function HeroWithViewer({
  items,
  title,
  height,
  area,
  emptyLabel,
  onVideoExpired,
  floorPlans,
  onMediaEvent,
}: HeroViewerProps & { onMediaEvent?: (event: MediaEvent) => void }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  return (
    <>
      <ShowroomHero
        items={items}
        height={height}
        area={area}
        emptyLabel={emptyLabel}
        onOpen={(index, room) => {
          onMediaEvent?.({ type: 'gallery_open', mediaIndex: index });
          if (room) onMediaEvent?.({ type: 'media_category_select', room, mediaIndex: index });
          setOpenAt(index);
        }}
      />
      <MediaViewer
        items={items}
        open={openAt !== null}
        startIndex={openAt ?? 0}
        title={title}
        onClose={() => setOpenAt(null)}
        onMediaEvent={onMediaEvent}
        onVideoExpired={onVideoExpired}
        floorPlans={floorPlans}
      />
    </>
  );
}

/** Hero plus full-screen viewer, with the same media events as the web showroom. */
export function ShowroomMedia({
  listingId,
  market,
  ...rest
}: HeroViewerProps & { listingId: string; market: ShowroomEventMarket }) {
  const onMediaEvent = ({ type, mediaIndex, room }: MediaEvent) =>
    trackShowroom({
      name: type,
      listingId,
      market,
      props: { ...(mediaIndex !== undefined ? { mediaIndex } : {}), ...(room ? { room } : {}) },
    });
  return <HeroWithViewer {...rest} onMediaEvent={onMediaEvent} />;
}

/**
 * The same hero and viewer for an owner or host looking at their own listing. Sends no events:
 * the showroom funnel counts renters and buyers, not listers checking their photos.
 */
export function ShowroomPreview(props: HeroViewerProps) {
  return <HeroWithViewer {...props} />;
}

/** One `property_detail_view` per listing shown. */
export function useTrackDetailView(listingId: string | undefined, market: ShowroomEventMarket) {
  useEffect(() => {
    if (listingId) trackShowroom({ name: 'property_detail_view', listingId, market });
  }, [listingId, market]);
}
