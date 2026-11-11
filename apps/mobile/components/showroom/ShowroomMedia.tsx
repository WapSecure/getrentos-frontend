import { useEffect, useState } from 'react';
import type { MediaItem, ShowroomEventMarket } from '@sureground/shared/showroom';
import { trackShowroom } from '@/lib/showroomAnalytics';
import { MediaViewer, type MediaEvent } from './MediaViewer';
import { ShowroomHero } from './ShowroomHero';

/** Hero plus full-screen viewer, with the same media events as the web showroom. */
export function ShowroomMedia({
  listingId,
  market,
  items,
  title,
  height,
  area,
  emptyLabel,
  onVideoExpired,
}: {
  listingId: string;
  market: ShowroomEventMarket;
  items: MediaItem[];
  title: string;
  height?: number;
  area?: string | null;
  emptyLabel?: string;
  onVideoExpired?: () => void;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const onMediaEvent = ({ type, mediaIndex, room }: MediaEvent) =>
    trackShowroom({
      name: type,
      listingId,
      market,
      props: { ...(mediaIndex !== undefined ? { mediaIndex } : {}), ...(room ? { room } : {}) },
    });

  return (
    <>
      <ShowroomHero
        items={items}
        height={height}
        area={area}
        emptyLabel={emptyLabel}
        onOpen={(index) => {
          onMediaEvent({ type: 'gallery_open', mediaIndex: index });
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
      />
    </>
  );
}

/** One `property_detail_view` per listing shown. */
export function useTrackDetailView(listingId: string | undefined, market: ShowroomEventMarket) {
  useEffect(() => {
    if (listingId) trackShowroom({ name: 'property_detail_view', listingId, market });
  }, [listingId, market]);
}
