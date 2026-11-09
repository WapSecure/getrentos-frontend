'use client';

import { useState, type ReactNode } from 'react';
import { Home } from 'lucide-react';

interface PropertyPhotoProps {
  src: string | undefined;
  alt: string;
  className?: string;
  isEmptyText?: string;
  children?: ReactNode;
}

// Plain <img>: the API serves short-lived signed URLs, which next/image would try to optimise.
export const PropertyPhoto = ({
  src,
  alt,
  className = '',
  isEmptyText = 'No photo yet',
  children,
}: PropertyPhotoProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative bg-muted ${className}`}>
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
          <Home className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-2xs text-muted-foreground">{isEmptyText}</p>
        </div>
      )}
      {children}
    </div>
  );
};
