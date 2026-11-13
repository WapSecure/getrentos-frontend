import type { ReactNode } from 'react';
import { Container } from './Container';
import { Eyebrow } from './Eyebrow';

interface ClosingBandProps {
  title: ReactNode;
  lead?: ReactNode;
  actions: ReactNode;
  /** A short label above the title; defaults to "Get started". */
  eyebrow?: string;
}

/**
 * The full-width Sureground blue band that closes a page. Every line of text on it is full-strength
 * `primary-foreground`, never faded, so it passes contrast in both themes.
 */
export const ClosingBand = ({
  title,
  lead,
  actions,
  eyebrow = 'Get started',
}: ClosingBandProps) => (
  <section
    className="relative isolate overflow-hidden bg-primary text-primary-foreground"
    aria-label="Get started"
  >
    {/* Two quiet rings, drawn in the band's own foreground: decoration only. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-40 -right-40 -z-10 h-[34rem] w-[34rem] rounded-full border border-primary-foreground/15 md:-top-56 md:-right-24 md:h-[46rem] md:w-[46rem]"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-16 -right-16 -z-10 h-[20rem] w-[20rem] rounded-full border border-primary-foreground/10 md:-top-24 md:right-24 md:h-[28rem] md:w-[28rem]"
    />
    <Container className="flex flex-col gap-10 py-20 md:flex-row md:items-end md:justify-between md:py-28">
      <div className="max-w-2xl">
        <Eyebrow tone="light" className="mb-6">
          {eyebrow}
        </Eyebrow>
        <h2 className="font-display text-[2.25rem] leading-[1.06] font-light tracking-[-0.015em] text-balance text-primary-foreground md:text-[3.5rem]">
          {title}
        </h2>
        {lead ? (
          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-primary-foreground md:text-[1.0625rem]">
            {lead}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
    </Container>
  </section>
);
