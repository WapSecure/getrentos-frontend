'use client';

import Image, { type ImageProps } from 'next/image';
import { Component, useState, type ReactNode } from 'react';

type SafeImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src?: string | null;
  alt?: string;
  fallback?: ReactNode;
};

// `next/image` throws during render for a host outside `images.remotePatterns`, wiping the whole page: the boundary catches that, `onError` catches load failures.
export function SafeImage({
  src,
  alt = '',
  fallback = null,
  onError,
  ...imageProps
}: SafeImageProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);

  // Refuse protocol-relative or malformed values here rather than let next/image throw.
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

class ImageBoundary extends Component<ImageBoundaryProps, ImageBoundaryState> {
  state: ImageBoundaryState = { failed: false };

  static getDerivedStateFromError(): ImageBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
