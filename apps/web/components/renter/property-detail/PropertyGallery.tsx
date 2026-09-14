'use client';

import { useState } from 'react';
import { Camera, Home, Play } from 'lucide-react';

interface PropertyGalleryProps {
  /** Signed photo URLs, cover first. */
  images?: string[];
  /** Signed URL of the landlord's walkthrough video, when there is one. */
  videoTourUrl?: string;
  /** Fallback for older payloads that only carry a single cover URL. */
  fallbackImage?: string;
  onOpenTour: () => void;
}

export const PropertyGallery = ({
  images,
  videoTourUrl,
  fallbackImage,
  onOpenTour,
}: PropertyGalleryProps) => {
  const photos = images?.length ? images : fallbackImage ? [fallbackImage] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const active = photos[activeIndex];
  const showPlaceholder = !active || failed[activeIndex];

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div className="relative h-80 bg-linear-to-br from-secondary to-muted">
        {showPlaceholder ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Home className="w-12 h-12 text-gray-700/40" />
            <p className="text-xs text-muted-foreground">No photo for this property yet</p>
          </div>
        ) : (
          // Signed MinIO URLs, so plain <img> rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active}
            alt={`Property photo ${activeIndex + 1}`}
            onError={() => setFailed((prev) => ({ ...prev, [activeIndex]: true }))}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {videoTourUrl && (
          <button
            onClick={onOpenTour}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full hover:bg-black/80 transition-colors"
          >
            <Camera className="w-3 h-3" />
            <span>Video tour</span>
            <Play className="w-2 h-2 ml-0.5" />
          </button>
        )}

        {photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {photos.length}
          </span>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-1.5 p-2 bg-card overflow-x-auto">
          {photos.map((url, index) => (
            <button
              key={`${url.slice(-24)}-${index}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                index === activeIndex
                  ? 'border-primary'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {failed[index] ? (
                <span className="flex h-full w-full items-center justify-center bg-secondary">
                  <Home className="w-4 h-4 text-gray-400" />
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  onError={() => setFailed((prev) => ({ ...prev, [index]: true }))}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
