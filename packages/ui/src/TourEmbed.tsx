'use client';

import { useState } from 'react';
import { Compass } from '@sureground/icons';
import { cn, tourSource } from '@sureground/shared';

interface TourEmbedProps {
  url: string;
  title: string;
  className?: string;
}

/** Loads the provider only on request: a 360 tour is heavy on mobile data. */
export function TourEmbed({ url, title, className }: TourEmbedProps) {
  const [open, setOpen] = useState(false);
  const tour = tourSource(url);
  if (!tour) return null;

  return (
    <div className={cn('relative aspect-video w-full overflow-hidden bg-black', className)}>
      {open ? (
        // Only known 360 providers are framed: their scripts run but can't reach our page.
        <iframe
          src={tour.embedUrl}
          title={title}
          className="h-full w-full"
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30">
            <Compass className="h-7 w-7" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold">Open the 360 tour</span>
          <span className="text-sm text-white/70">
            Hosted by {tour.host}. Uses more data than photos.
          </span>
        </button>
      )}
    </div>
  );
}
