import type { ReactNode } from 'react';
import { Container } from './Container';

interface ClosingBandProps {
  title: ReactNode;
  lead?: ReactNode;
  actions: ReactNode;
}

/** The full-width band that closes a page: ink on a light page, paper on a dark one. */
export const ClosingBand = ({ title, lead, actions }: ClosingBandProps) => (
  <section className="bg-primary text-primary-foreground" aria-label="Get started">
    <Container className="flex flex-col gap-10 py-16 md:flex-row md:items-end md:justify-between md:py-24">
      <div className="max-w-2xl">
        <h2 className="font-display text-[2.125rem] leading-[1.08] font-light tracking-[-0.01em] text-balance text-primary-foreground md:text-[3.25rem]">
          {title}
        </h2>
        {lead ? <p className="mt-5 max-w-[52ch] text-primary-foreground/70">{lead}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3">{actions}</div>
    </Container>
  </section>
);
