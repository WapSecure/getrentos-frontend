import type { ReactNode } from 'react';
import { Container } from './Container';

interface ClosingBandProps {
  title: ReactNode;
  lead?: ReactNode;
  actions: ReactNode;
}

/** The dark full-width band that closes a page before the footer. Always dark, in both themes. */
export const ClosingBand = ({ title, lead, actions }: ClosingBandProps) => (
  <section className="bg-[#0f1014] text-[#f3f1ec]" aria-label="Get started">
    <Container className="flex flex-col gap-10 py-16 md:flex-row md:items-end md:justify-between md:py-24">
      <div className="max-w-2xl">
        <h2 className="font-display text-[2.125rem] leading-[1.08] font-light tracking-[-0.01em] text-balance text-[#f3f1ec] md:text-[3.25rem]">
          {title}
        </h2>
        {lead ? <p className="mt-5 max-w-[52ch] text-[#b9b8b3]">{lead}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3">{actions}</div>
    </Container>
  </section>
);
