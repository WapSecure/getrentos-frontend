import Link from 'next/link';
import { Container } from '@/components/marketing/Container';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { photos } from '@/components/marketing/photos';
import { publishedAreas } from '@/lib/areaInventory';
import { areaSlug } from '@/lib/areaSlug';
import { AREAS, CITIES } from './areas';
import { searchHref } from './searchRoutes';

/** Plain links to area pages (where an area has enough listings) or searches: useful for people, and crawlable. */
export const AreaIndex = async () => {
  const published = new Set((await publishedAreas()).map((area) => area.slug));
  const hrefFor = (name: string) => {
    const slug = areaSlug(name);
    return published.has(slug) ? `/areas/${slug}` : searchHref('rent', name);
  };
  return (
    <section aria-labelledby="areas-title" className="py-20 md:py-28">
      <Container>
        <SectionIntro
          id="areas-title"
          eyebrow="Where people are looking"
          title="Search by area"
          lead="Start from a neighbourhood you know. Each link opens what is listed there now."
        />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <PhotoFrame
            photo={photos.lekkiIkoyiLinkBridge}
            aspect="aspect-[4/3] lg:aspect-[4/5]"
            sizes="(min-width: 1024px) 40vw, 100vw"
          />
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-2">
            {CITIES.map((city) => (
              <div key={city} className="min-w-0 border-t-2 border-primary pt-5">
                <h3 className="font-display mb-4 text-2xl font-normal">{city}</h3>
                <ul
                  className={`text-[0.9375rem] [&>li]:mb-2.5 ${city === 'Lagos' ? 'columns-2 gap-6' : ''}`}
                >
                  {AREAS.filter((area) => area.city === city).map((area) => (
                    <li key={area.name}>
                      <Link
                        href={hrefFor(area.name)}
                        className="rounded-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {area.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
