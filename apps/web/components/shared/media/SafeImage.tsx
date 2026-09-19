'use client';

import Image, { type ImageProps } from 'next/image';
import { Component, useState, type ReactNode } from 'react';

type SafeImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  /** Absolute or root-relative URL. Anything else renders the fallback. */
  src?: string | null;
  alt?: string;
  /** Rendered when the image cannot be shown. Defaults to nothing. */
  fallback?: ReactNode;
};

/**
 * Catches `next/image` failures so one bad URL cannot take down a whole page.
 *
 * This is not defensive padding — it is a real failure mode. `next/image`
 * throws *synchronously during render* when a remote URL's host is not in
 * `images.remotePatterns` (or, on Next 16, resolves to a private IP). Public
 * pages render inside an error boundary, so that single throw replaces the
 * entire page: an estate's storefront vanished because one photo was
 * misconfigured. Per-image isolation turns that into a placeholder.
 *
 * Two separate guards, because they catch different things:
 * - a render-time boundary, for the throw above (an `onError` handler never
 *   fires — the failure happens before an <img> exists);
 * - an `onError` handler, for a URL that is configured correctly but fails to
 *   load (expired signature, deleted object).
 *
 * Every image on a page that renders a stored upload should go through this;
 * one unwrapped image is enough to wipe the page it is on.
 */
export function SafeImage({
  src,
  alt = '',
  fallback = null,
  onError,
  ...imageProps
}: SafeImageProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);

  // A stored asset is always reachable as an absolute (signed) URL or a
  // root-relative path. A protocol-relative or malformed value is refused here
  // rather than throwing from inside next/image.
  const trimmed = typeof src === 'string' ? src.trim() : '';
  const usable = /^https?:\/\//i.test(trimmed) || /^\/(?!\/)/.test(trimmed);

  if (!usable || failedToLoad) return <>{fallback}</>;

  return (
    <ImageBoundary fallback={fallback}>
      <Image
        {...imageProps}
        src={trimmed}
        alt={alt}
        onError={(event) => {
          setFailedToLoad(true);
          onError?.(event);
        }}
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
