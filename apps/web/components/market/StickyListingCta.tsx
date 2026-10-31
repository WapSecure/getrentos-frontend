'use client';

import { useEffect, useState } from 'react';
import type { PublicDetailMarket } from '@/lib/publicListingDetail';
import { ListingCallToAction } from './ListingCallToAction';

/**
 * The price and main action, pinned to the bottom of the screen while the
 * page's own call to action is out of view: on a phone that is below the
 * gallery and every detail, so without this the visitor has to scroll the
 * whole page to find out how to enquire.
 */
export function StickyListingCta({
  watchId,
  price,
  priceUnit,
  market,
  id,
  returnPath,
}: {
  /** Id of the page's own call to action; the bar hides while it is on screen. */
  watchId: string;
  price: string;
  priceUnit?: string | null;
  market: PublicDetailMarket;
  id: string;
  returnPath: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target || typeof IntersectionObserver === 'undefined') return;
    // Shown until the page's own button is wholly on screen, not just its top edge.
    const observer = new IntersectionObserver(
      ([entry]) => setShow(entry.intersectionRatio < 1),
      { threshold: [0, 1] }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <p className="min-w-0 flex-1 truncate text-lg font-bold text-foreground">
          {price}
          {priceUnit && (
            <span className="text-sm font-normal text-muted-foreground">/{priceUnit}</span>
          )}
        </p>
        <div className="w-auto shrink-0 sm:w-64 [&>a]:px-5">
          <ListingCallToAction market={market} id={id} returnPath={returnPath} compact />
        </div>
      </div>
    </div>
  );
}
