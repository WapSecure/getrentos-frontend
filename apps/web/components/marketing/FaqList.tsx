import type { ReactNode } from 'react';
import { Disclosure } from '@sureground/ui/Disclosure';
import { Container } from './Container';
import { SectionIntro } from './SectionIntro';

export interface Faq {
  q: string;
  a: ReactNode;
}

interface FaqListProps {
  items: Faq[];
  /** Disclosures sharing a name open one at a time. */
  name: string;
  title?: string;
  eyebrow?: string;
}

export const FaqList = ({
  items,
  name,
  title = 'Before you start',
  eyebrow = 'Questions',
}: FaqListProps) => (
  <section aria-labelledby={`${name}-title`} className="py-20 md:py-28">
    <Container className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-16">
      <SectionIntro
        id={`${name}-title`}
        eyebrow={eyebrow}
        title={title}
        layout="stacked"
        className="mb-0"
      />
      <div className="border-t border-border">
        {items.map(({ q, a }) => (
          <Disclosure
            key={q}
            name={name}
            summary={<span className="font-display text-xl font-normal">{q}</span>}
            className="border-b border-border"
          >
            <div className="max-w-[62ch] text-[0.9375rem]">{a}</div>
          </Disclosure>
        ))}
      </div>
    </Container>
  </section>
);
