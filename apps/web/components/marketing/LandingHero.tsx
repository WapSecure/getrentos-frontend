import type { ReactNode } from 'react';
import { Container } from './Container';
import { Eyebrow } from './Eyebrow';
import { PhotoFrame } from './PhotoFrame';
import type { MarketingPhoto } from './photos';

interface LandingHeroProps {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  actions?: ReactNode;
  photo: MarketingPhoto;
  id?: string;
}

/** The opening of a landing page: one h1, one promise, the next step, and a photo. */
export const LandingHero = ({
  eyebrow,
  title,
  lead,
  actions,
  photo,
  id = 'page-title',
}: LandingHeroProps) => (
  <section aria-labelledby={id} className="pt-24 pb-16 md:pt-32 md:pb-24">
    <Container className="grid items-end gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16">
      <div className="hero-rise">
        <Eyebrow className="mb-5">{eyebrow}</Eyebrow>
        <h1
          id={id}
          className="text-[2.5rem] leading-[1.04] font-light tracking-[-0.02em] text-balance sm:text-[3.25rem] lg:text-[4rem]"
        >
          {title}
        </h1>
        <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-muted-foreground md:text-[1.0625rem]">
          {lead}
        </p>
        {actions ? <div className="mt-9 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <PhotoFrame
        photo={photo}
        aspect="aspect-[4/3] md:aspect-[4/5]"
        sizes="(min-width: 768px) 45vw, 100vw"
        priority
      />
    </Container>
  </section>
);
