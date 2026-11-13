import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Building2, Home, MapPin } from '@sureground/icons';
import { Breadcrumbs } from '@sureground/ui/Breadcrumbs';
import { AREAS, type Area } from '@/components/home/areas';
import { searchHref } from '@/components/home/searchRoutes';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { ArrowLink } from '@/components/marketing/ArrowLink';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { Eyebrow } from '@/components/marketing/Eyebrow';
import { IconTile } from '@/components/marketing/IconTile';
import { ListingTile } from '@/components/marketing/ListingTile';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  MIN_AREA_LISTINGS,
  areaInventory,
  inventoryTotal,
  type AreaInventory,
} from '@/lib/areaInventory';
import { areaSlug, findBySlug } from '@/lib/areaSlug';
import { breadcrumbJsonLd } from '@/lib/structuredData';
import type { PublicListingCard, PublicMarket } from '@/lib/publicListingMap';
import { ROUTES } from '@/lib/constants/auth';

interface AreaPageProps {
  params: Promise<{ slug: string }>;
}

type Loaded = { kind: 'ok'; inventory: AreaInventory } | { kind: 'missing' };

/** Unknown area, or too few live listings to be worth a page: both are a 404. */
async function load(slug: string): Promise<Loaded> {
  const area = findBySlug(AREAS, slug);
  if (!area) return { kind: 'missing' };
  const inventory = await areaInventory(area);
  // An unreachable API is an outage, not a missing page: let error.tsx offer a retry.
  if (!inventory) throw new Error(`Area inventory unavailable for ${slug}`);
  if (inventoryTotal(inventory) < MIN_AREA_LISTINGS) return { kind: 'missing' };
  return { kind: 'ok', inventory };
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function summary({ rentTotal, saleTotal }: AreaInventory): string {
  const parts = [
    rentTotal ? plural(rentTotal, 'home to rent', 'homes to rent') : null,
    saleTotal ? plural(saleTotal, 'property for sale', 'properties for sale') : null,
  ].filter(Boolean);
  return parts.join(' and ');
}

const titleFor = (area: Area) => `Property in ${area.name}, ${area.city}`;

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await load(slug);
  if (result.kind !== 'ok') {
    // The root Suspense boundary can flush a 200 before notFound(); noindex keeps the shell out of search.
    return { title: 'Area not found', robots: { index: false, follow: false } };
  }
  const { area } = result.inventory;
  return {
    title: `${titleFor(area)}: homes to rent and buy`,
    description: `${summary(result.inventory)} in ${area.name}, ${area.city}, listed on Sureground with each listing's verification status shown.`,
    alternates: { canonical: `/areas/${areaSlug(area.name)}` },
  };
}

const ListingSection = ({
  id,
  eyebrow,
  title,
  listings,
  total,
  market,
  href,
  linkLabel,
  tinted,
}: {
  id: string;
  eyebrow: string;
  title: string;
  listings: PublicListingCard[];
  total: number;
  market: PublicMarket;
  href: string;
  linkLabel: string;
  tinted?: boolean;
}) => (
  <section
    aria-labelledby={id}
    className={tinted ? 'border-y border-border bg-card py-20 md:py-24' : 'py-20 md:py-24'}
  >
    <Container>
      <SectionIntro
        id={id}
        eyebrow={eyebrow}
        title={title}
        action={
          total > listings.length ? (
            <ArrowLink href={href}>{`${linkLabel} (${total})`}</ArrowLink>
          ) : (
            <ArrowLink href={href}>{linkLabel}</ArrowLink>
          )
        }
      />
      <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, index) => (
          <li key={listing.id}>
            <ListingTile listing={listing} market={market} eager={index < 3} />
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

export default async function AreaPage({ params }: AreaPageProps) {
  const { slug } = await params;
  const result = await load(slug);
  if (result.kind !== 'ok') notFound();

  const { inventory } = result;
  const { area } = inventory;
  const path = `/areas/${areaSlug(area.name)}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: area.city, path: searchHref('rent', area.city) },
    { name: area.name, path },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Navigation />
      <main id="main" className="bg-background">
        <section aria-labelledby="page-title" className="pt-24 pb-12 md:pt-32 md:pb-16">
          <Container>
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: area.city, href: searchHref('rent', area.city) },
                { label: area.name },
              ]}
              className="mb-8"
            />
            <Eyebrow className="mb-5">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {area.city}
              </span>
            </Eyebrow>
            <h1
              id="page-title"
              className="text-[2.5rem] leading-[1.04] font-light tracking-[-0.02em] text-balance sm:text-[3.25rem] lg:text-[4rem]"
            >
              {titleFor(area)}
            </h1>
            <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-muted-foreground md:text-[1.0625rem]">
              {summary(inventory)} listed on Sureground right now. Each listing shows whether the
              owner and property have been verified, so you can see what has been checked before you
              enquire.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {inventory.rentTotal > 0 ? (
                <CtaLink href={searchHref('rent', area.name)} arrow>
                  Homes to rent
                </CtaLink>
              ) : null}
              {inventory.saleTotal > 0 ? (
                <CtaLink
                  href={searchHref('buy', area.name)}
                  variant={inventory.rentTotal > 0 ? 'outline' : 'ink'}
                  arrow={inventory.rentTotal === 0}
                >
                  Property for sale
                </CtaLink>
              ) : null}
            </div>
            {/* Live counts from the same search the page is built from; nothing estimated. */}
            <ul className="mt-12 grid max-w-2xl grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2">
              {inventory.rentTotal > 0 ? (
                <li className="flex items-center gap-4">
                  <IconTile icon={Home} />
                  <div>
                    <p className="label-caps text-muted-foreground">Homes to rent</p>
                    <p className="font-display text-[2rem] leading-none font-normal tabular-nums text-foreground">
                      {inventory.rentTotal}
                    </p>
                  </div>
                </li>
              ) : null}
              {inventory.saleTotal > 0 ? (
                <li className="flex items-center gap-4">
                  <IconTile icon={Building2} />
                  <div>
                    <p className="label-caps text-muted-foreground">Property for sale</p>
                    <p className="font-display text-[2rem] leading-none font-normal tabular-nums text-foreground">
                      {inventory.saleTotal}
                    </p>
                  </div>
                </li>
              ) : null}
            </ul>
          </Container>
        </section>

        {inventory.rent.length > 0 ? (
          <ListingSection
            id="area-rent"
            eyebrow="To rent"
            title={`Homes to rent in ${area.name}`}
            listings={inventory.rent}
            total={inventory.rentTotal}
            market="rent"
            href={searchHref('rent', area.name)}
            linkLabel="All homes to rent"
            tinted
          />
        ) : null}

        {inventory.sale.length > 0 ? (
          <ListingSection
            id="area-sale"
            eyebrow="For sale"
            title={`Property for sale in ${area.name}`}
            listings={inventory.sale}
            total={inventory.saleTotal}
            market="sale"
            href={searchHref('buy', area.name)}
            linkLabel="All property for sale"
            tinted={inventory.rent.length === 0}
          />
        ) : null}

        <ClosingBand
          eyebrow={`List in ${area.name}`}
          title={`Own property in ${area.name}?`}
          lead="List it on Sureground. Verified owners and properties are marked as verified, so people can see what has been checked."
          actions={
            <>
              <CtaLink href="/sell" variant="light" arrow>
                Sell a property
              </CtaLink>
              <CtaLink href={ROUTES.SIGNUP} variant="outline-light">
                Create an account
              </CtaLink>
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
