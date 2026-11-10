'use client';

import { useEffect } from 'react';
import { MediaMosaic, type MediaEvent } from '@sureground/ui';
import type { MediaItem, ShowroomMarket } from '@sureground/shared/showroom';
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

/** The page is a server component, so the media callbacks live in this client island. */
export function ShowroomMedia({
  listingId,
  market,
  items,
  title,
  className,
}: {
  listingId: string;
  market: ShowroomMarket;
  items: MediaItem[];
  title: string;
  className?: string;
}) {
  const onMediaEvent = ({ type, mediaIndex, room }: MediaEvent) =>
    track({
      name: type,
      listingId,
      market,
      surface: 'listing_page',
      props: { ...(mediaIndex !== undefined ? { mediaIndex } : {}), ...(room ? { room } : {}) },
    });
  return (
    <MediaMosaic items={items} title={title} className={className} onMediaEvent={onMediaEvent} />
  );
}
