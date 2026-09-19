'use client';

import Image from 'next/image';
import { Component, useState, type ReactNode } from 'react';

interface SafeImageProps {
  /** Absolute or root-relative URL. Anything else, or a failure, renders the fallback. */
  src?: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Rendered in place of the image when it cannot be shown. */
  fallback: ReactNode;
}

/**
 * Catches `next/image` failures so one bad URL cannot take down a whole page.
 *
 * This is not defensive padding — it is a real failure mode. `next/image`
 * throws *synchronously during render* when a remote URL's host is not in
 * `images.remotePatterns` (or, on Next 16, resolves to a private IP). Public
 * pages are rendered inside an error boundary, so that throw replaces the
 * entire page: an estate's storefront vanished because one photo was
 * misconfigured. Per-image isolation turns that into a placeholder.
 *
 * Two separate guards, because they catch different things:
 * - a render-time boundary, for the throw above (an `onError` handler never
 *   fires — the failure happens before an <img> exists);
 * - an `onError` handler, for a URL that is configured correctly but fails to
 *   load (expired signature, deleted object).
 */
export function SafeImage({
  src,
  alt = '',
  className,
  sizes,
  priority,
  fallback,
}: SafeImageProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);

  // A signature URL is always absolute; only `http(s)://` and root-relative
  // paths are handled, so a protocol-relative or malformed value is refused
  // here rather than throwing from inside next/image.
  const trimmed = typeof src === 'string' ? src.trim() : '';
  const usable = /^https?:\/\//i.test(trimmed) || /^\/(?!\/)/.test(trimmed);

  if (!usable || failedToLoad) return <>{fallback}</>;

  return (
    <ImageBoundary fallback={fallback}>
      <Image
        src={trimmed}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        onError={() => setFailedToLoad(true)}
      />
    </ImageBoundary>
  );
}

interface ImageBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ImageBoundaryState {
  failed: boolean;
}

/** Class component because only class components can be error boundaries. */
class ImageBoundary extends Component<ImageBoundaryProps, ImageBoundaryState> {
  state: ImageBoundaryState = { failed: false };

  static getDerivedStateFromError(): ImageBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
