import { Container } from '@/components/marketing/Container';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { photos } from '@/components/marketing/photos';
import { HeroSearch } from './HeroSearch';

export const HomeHero = () => (
  <section aria-labelledby="home-title" className="pt-24 md:pt-32">
    <Container>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-end md:gap-16">
        <div className="hero-rise">
          <p className="label-caps mb-5 text-muted-foreground">
            Homes, short stays and land across Nigeria
          </p>
          <h1
            id="home-title"
            className="text-[2.625rem] leading-[1.02] font-light tracking-[-0.02em] text-balance sm:text-[3.5rem] lg:text-[4.75rem]"
          >
            Property you can check before you commit
          </h1>
        </div>
        <p className="hero-rise max-w-[44ch] text-base leading-relaxed text-muted-foreground [animation-delay:80ms] md:pb-3 md:text-[1.0625rem]">
          Search homes to rent or buy, short stays and land. Each listing shows what has been
          verified, and payments go through Sureground Payment Protection.
        </p>
      </div>
    </Container>

    <Container className="mt-8 md:mt-14">
      {/* Phones get the search first and the photo after it; wider screens float the search over the photo. */}
      <div className="relative flex flex-col-reverse gap-6 md:block">
        <PhotoFrame
          photo={photos.lagosAerial}
          aspect="aspect-[4/3] sm:aspect-[16/8] lg:aspect-[16/7]"
          sizes="(min-width: 1240px) 1160px, 100vw"
          priority
        />
        <div className="relative md:absolute md:inset-x-10 md:bottom-0 md:translate-y-1/2">
          <HeroSearch />
        </div>
      </div>
    </Container>
    <div aria-hidden="true" className="hidden h-24 md:block" />
  </section>
);
