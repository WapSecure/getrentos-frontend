import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { photos } from '@/components/marketing/photos';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';

const CAPSULE = 'rounded-full';

/** Shown only while Diaspora Invest is switched on (checked server-side by the page). */
export const DiasporaFeature = () => (
  <section aria-labelledby="diaspora-title" className="py-20 md:py-28">
    <Container className="grid items-center gap-14 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-20">
      <div>
        <p className="label-caps mb-4 text-muted-foreground">Diaspora Invest</p>
        <h2
          id="diaspora-title"
          className="font-display text-[2.125rem] leading-[1.08] font-light tracking-[-0.01em] text-balance md:text-[3rem]"
        >
          Own property at home from wherever you live
        </h2>
        <p className="mt-6 max-w-[48ch] leading-relaxed text-muted-foreground">
          Find, buy and manage property in Nigeria from abroad. Checks are carried out by named
          professionals, payments go through Sureground Payment Protection, and every document and
          update sits in one workspace. We never promise returns.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <CtaLink href={DIASPORA_ROUTES.PUBLIC} arrow>
            How it works
          </CtaLink>
        </div>
      </div>
      <div aria-hidden="true" className="mx-auto grid w-full max-w-md grid-cols-3 gap-3 sm:gap-4">
        <PhotoFrame
          photo={photos.livingRoomWhite}
          decorative
          aspect="aspect-[1/1.55]"
          sizes="160px"
          className={`${CAPSULE} mt-10`}
        />
        <PhotoFrame
          photo={photos.houseDusk}
          decorative
          aspect="aspect-[1/2.2]"
          sizes="160px"
          className={CAPSULE}
        />
        <PhotoFrame
          photo={photos.houseDarkFacade}
          decorative
          aspect="aspect-[1/1.75]"
          sizes="160px"
          className={`${CAPSULE} mt-6`}
        />
        <PhotoFrame
          photo={photos.lagosApartments}
          decorative
          aspect="aspect-[2.3/1]"
          sizes="320px"
          className={`${CAPSULE} col-span-2 -mt-10`}
        />
      </div>
    </Container>
  </section>
);
