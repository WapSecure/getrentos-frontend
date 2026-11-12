import type { ReactNode } from 'react';
import { cn } from '@sureground/shared';

interface SectionIntroProps {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  /** A link or button aligned with the lead, e.g. "View all homes to rent". */
  action?: ReactNode;
  /** `split`: title left, lead right (Brik). `stacked`: one column. */
  layout?: 'split' | 'stacked' | 'centered';
  id?: string;
  className?: string;
}

export const SectionIntro = ({
  eyebrow,
  title,
  lead,
  action,
  layout = 'split',
  id,
  className,
}: SectionIntroProps) => (
  <div
    className={cn(
      'mb-10 gap-x-12 gap-y-4 md:mb-14',
      layout === 'split' && 'grid items-end md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]',
      layout === 'stacked' && 'flex max-w-3xl flex-col',
      layout === 'centered' && 'mx-auto flex max-w-2xl flex-col items-center text-center',
      className
    )}
  >
    <div className="min-w-0">
      {eyebrow ? <p className="label-caps mb-4 text-muted-foreground">{eyebrow}</p> : null}
      <h2
        id={id}
        className="font-display text-[2rem] leading-[1.1] font-normal tracking-[-0.01em] text-balance md:text-[2.75rem]"
      >
        {title}
      </h2>
    </div>
    {lead || action ? (
      <div className="flex min-w-0 flex-col gap-5">
        {lead ? (
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground md:text-[1.0625rem]">
            {lead}
          </p>
        ) : null}
        {action ? <div>{action}</div> : null}
      </div>
    ) : null}
  </div>
);
