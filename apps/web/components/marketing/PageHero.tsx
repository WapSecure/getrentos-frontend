import type { ReactNode } from 'react';
import { cn } from '@sureground/shared';
import { Container } from './Container';

interface PageHeroProps {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Extra content under the lead, e.g. a status note or an in-page index. */
  children?: ReactNode;
  id?: string;
  /** Narrows the text column for long-form pages (legal, policy). */
  narrow?: boolean;
  className?: string;
}

/** A text-only page opening for directories and long-form pages: eyebrow, light serif h1, lead. */
export const PageHero = ({
  eyebrow,
  title,
  lead,
  children,
  id = 'page-title',
  narrow = false,
  className,
}: PageHeroProps) => (
  <section aria-labelledby={id} className={cn('pt-24 pb-12 md:pt-32 md:pb-16', className)}>
    <Container className={cn(narrow && 'max-w-[860px]')}>
      <p className="label-caps mb-5 text-muted-foreground">{eyebrow}</p>
      <h1
        id={id}
        className="max-w-[18ch] text-[2.5rem] leading-[1.04] font-light tracking-[-0.02em] text-balance sm:text-[3.25rem] lg:text-[4rem]"
      >
        {title}
      </h1>
      {lead ? (
        <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground md:text-[1.0625rem]">
          {lead}
        </p>
      ) : null}
      {children}
    </Container>
  </section>
);
