'use client';

import { useState, type ReactNode } from 'react';
import { Home } from 'lucide-react';

interface PropertyPhotoProps {
  /** Signed cover URL from the API; may be empty when the landlord has no photo. */
  src: string | undefined;
  alt: string;
  /** Extra classes for the wrapper, which is the element that carries the height. */
  className?: string;
  isEmptyText?: string;
  /** Overlays such as a save button or status badge, positioned against the photo. */
  children?: ReactNode;
}

/**
 * Renter-facing listing photo with a graceful placeholder.
 *
 * The API serves short-lived signed MinIO URLs, so this uses a plain <img>
 * (next/image would try to optimise an already-expiring URL).
 */
export const PropertyPhoto = ({
  src,
  alt,
  className = '',
  isEmptyText = 'No photo yet',
  children,
}: PropertyPhotoProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative bg-linear-to-br from-secondary to-muted ${className}`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <Home className="h-8 w-8 text-gray-400 dark:text-gray-600" />
          <p className="text-[10px] text-muted-foreground">{isEmptyText}</p>
        </div>
      )}
      {children}
    </div>
  );
};
