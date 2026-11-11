'use client';

import { useLayoutEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { cn, placeholderOf } from '@sureground/shared';

export interface ProgressiveImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** A tiny blurred `data:` URI from the API. Without a valid one this is a plain `<img>`, exactly as before. */
  placeholder?: string | null;
}

/**
 * An `<img>` that shows a blurred placeholder until the photo loads, then fades it in (no fade with reduced motion).
 * The parent must be positioned (`relative`) and clip (`overflow-hidden`): the placeholder fills it.
 */
export function ProgressiveImg({ placeholder, className, onLoad, ...props }: ProgressiveImgProps) {
  const blur = placeholderOf(placeholder);
  const ref = useRef<HTMLImageElement>(null);
  // Server HTML keeps the photo visible, so it never depends on JavaScript; only a photo still loading is hidden.
  const [phase, setPhase] = useState<'server' | 'loading' | 'shown'>('server');

  useLayoutEffect(() => {
    const img = ref.current;
    if (!blur || !img) return;
    setPhase(img.complete && img.naturalWidth > 0 ? 'shown' : 'loading');
  }, [blur, props.src]);

  if (!blur) {
    // eslint-disable-next-line @next/next/no-img-element -- signed storage URLs; callers pass alt
    return <img className={className} onLoad={onLoad} {...props} />;
  }

  return (
    <>
      {/* Stays behind the photo, so the fade never shows the bare background. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center blur-lg"
        style={{ backgroundImage: `url("${blur}")` }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URLs; callers pass alt */}
      <img
        ref={ref}
        {...props}
        onLoad={(event) => {
          setPhase('shown');
          onLoad?.(event);
        }}
        className={cn(
          'relative',
          className,
          'transition-[opacity,transform] motion-reduce:transition-none',
          phase === 'loading' ? 'opacity-0' : 'opacity-100'
        )}
      />
    </>
  );
}
