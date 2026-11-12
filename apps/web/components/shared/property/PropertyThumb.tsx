'use client';

import { House, LandPlot, type SgIcon } from '@sureground/icons';
import { cn } from '@sureground/shared';
import { SafeImage } from '@/components/shared/media/SafeImage';

const SIZES = {
  sm: { box: 'h-12 w-12 rounded-lg', icon: 'h-5 w-5', px: '48px' },
  md: { box: 'h-16 w-16 rounded-lg sm:h-20 sm:w-20 sm:rounded-xl', icon: 'h-6 w-6', px: '80px' },
} as const;

/**
 * The small square photo beside a property in a list. Without a photo, or when it fails to load,
 * it shows the kind of place (a house or a plot) so the row still reads at a glance.
 */
export const PropertyThumb = ({
  src,
  alt,
  place = 'home',
  icon,
  size = 'md',
  className,
}: {
  src?: string | null;
  alt: string;
  place?: 'home' | 'land';
  /** Overrides the place icon in the empty state. */
  icon?: SgIcon;
  size?: keyof typeof SIZES;
  className?: string;
}) => {
  const Icon = icon ?? (place === 'land' ? LandPlot : House);
  const s = SIZES[size];
  const fallback = (
    <span className="flex h-full w-full items-center justify-center bg-accent/60 text-primary">
      <Icon className={s.icon} aria-hidden="true" />
    </span>
  );
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden border border-border/70 bg-secondary',
        s.box,
        className
      )}
    >
      {src ? (
        <SafeImage
          src={src}
          alt={alt}
          fill
          sizes={s.px}
          className="object-cover"
          loading="lazy"
          fallback={fallback}
        />
      ) : (
        fallback
      )}
    </div>
  );
};
