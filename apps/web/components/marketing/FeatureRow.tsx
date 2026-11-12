import type { ReactNode } from 'react';
import { cn } from '@sureground/shared';
import { PhotoFrame } from './PhotoFrame';
import type { MarketingPhoto } from './photos';

interface FeatureRowProps {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  photo: MarketingPhoto;
  /** Puts the photo on the left on wide screens; phones always show text first. */
  reverse?: boolean;
  action?: ReactNode;
}

/** One alternating image-and-text row. Stack several for a "how it works" story. */
export const FeatureRow = ({
  eyebrow,
  title,
  children,
  photo,
  reverse,
  action,
}: FeatureRowProps) => (
  <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16 lg:gap-24">
    <div className={cn('min-w-0', reverse && 'md:order-2')}>
      <p className="label-caps mb-4 text-muted-foreground">{eyebrow}</p>
      <h3 className="font-display text-[1.875rem] leading-[1.12] font-normal tracking-[-0.01em] text-balance md:text-[2.375rem]">
        {title}
      </h3>
      <div className="mt-5 max-w-[48ch] space-y-3 leading-relaxed text-muted-foreground">
        {children}
      </div>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
    <PhotoFrame
      photo={photo}
      aspect="aspect-[4/3] md:aspect-[5/4]"
      sizes="(min-width: 768px) 50vw, 100vw"
      className={cn(reverse && 'md:order-1')}
    />
  </div>
);
