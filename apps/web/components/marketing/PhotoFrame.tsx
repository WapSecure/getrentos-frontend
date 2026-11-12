import Image from 'next/image';
import { cn } from '@sureground/shared';
import type { MarketingPhoto } from './photos';

interface PhotoFrameProps {
  photo: MarketingPhoto;
  /** Tailwind aspect class for the frame, e.g. `aspect-[4/3]`. */
  aspect?: string;
  sizes: string;
  /** Only for the one image that is the page's largest paint. */
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /** Decorative copies (a collage) hide from screen readers. */
  decorative?: boolean;
}

export const PhotoFrame = ({
  photo,
  aspect = 'aspect-[4/3]',
  sizes,
  priority = false,
  className,
  imageClassName,
  decorative = false,
}: PhotoFrameProps) => (
  <div className={cn('relative w-full overflow-hidden bg-muted', aspect, className)}>
    <Image
      src={photo.src}
      alt={decorative ? '' : photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      className={cn('object-cover', imageClassName)}
    />
  </div>
);
