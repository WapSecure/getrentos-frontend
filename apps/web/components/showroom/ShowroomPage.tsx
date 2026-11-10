import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ArrowLeft, BadgeCheck, Bath, BedDouble, Check, MapPin, Ruler } from '@sureground/icons';
import { Badge, DescriptionList, MediaMosaic } from '@sureground/ui';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { offerJsonLd } from '@/components/market/PublicListingPage';
import { SaveListingButton } from '@/components/market/SaveListingButton';
import { SimilarListings } from '@/components/market/SimilarListings';
import { StickyListingCta } from '@/components/market/StickyListingCta';
import { formatCurrency } from '@/lib/format';
import {
  fetchPublicListing,
  MARKET_PATH,
  type PublicDetailMarket,
} from '@/lib/publicListingDetail';
import { ShowroomAside } from './ShowroomAside';
import { ShowroomNeighbourhood } from './ShowroomNeighbourhood';
import { ShowroomShareButton } from './ShowroomShareButton';
import { ShowroomTrust } from './ShowroomTrust';

const MARKET_NOUN: Record<PublicDetailMarket, string> = {
  rent: 'Rentals',
  sale: 'Homes for sale',
  land: 'Land',
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-border/70 pt-8">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export async function ShowroomPage({
  market,
  id,
  extra,
}: {
  market: PublicDetailMarket;
  id: string;
  extra?: ReactNode;
}) {
  const listing = await fetchPublicListing(market, id);
  if (!listing) notFound();

  const back = MARKET_PATH[market];
  const path = `${back}/${id}`;
  const keyFacts = [
    listing.bedrooms ? { icon: BedDouble, label: `${listing.bedrooms} bed` } : null,
    listing.bathrooms ? { icon: Bath, label: `${listing.bathrooms} bath` } : null,
    listing.size ? { icon: Ruler, label: `${listing.size} m²` } : null,
  ].filter((f): f is NonNullable<typeof f> => !!f);

  return (
    <main className="min-h-screen bg-background pt-16">
      <JsonLd data={offerJsonLd(listing)} />
      <Navigation />
      <article className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href={back}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {MARKET_NOUN[market]}
        </Link>

        <MediaMosaic
          items={listing.media}
          title={listing.title}
          className="-mx-4 mt-3 rounded-none shadow-none sm:mx-0 sm:rounded-2xl sm:shadow-sm"
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-14">
          <div className="min-w-0 space-y-10">
            <header className="space-y-3">
              {listing.verified && (
                <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                  {market === 'land' ? 'Ownership verified' : 'Verified'}
                </Badge>
              )}
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground text-balance sm:text-4xl">
                  {listing.title}
                </h1>
                <div className="flex shrink-0 gap-2">
                  <ShowroomShareButton title={listing.title} path={path} />
                  <SaveListingButton
                    listingId={listing.id}
                    returnPath={path}
                    className="border-border bg-card text-foreground hover:bg-muted focus-visible:ring-primary"
                  />
                </div>
              </div>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {listing.address ? `${listing.address}, ${listing.location}` : listing.location}
                </span>
              </p>
              {/* Phones see the price here; the full breakdown sits further down. */}
              <p className="data-value text-2xl font-semibold tracking-[-0.025em] text-foreground lg:hidden">
                {formatCurrency(listing.price)}
                {listing.priceUnit && (
                  <span className="text-base font-normal text-muted-foreground">
                    /{listing.priceUnit}
                  </span>
                )}
              </p>
              {keyFacts.length > 0 && (
                <ul className="flex flex-wrap gap-3 pt-1 text-sm text-foreground">
                  {keyFacts.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="flex items-center gap-2 rounded-lg bg-secondary px-3.5 py-2"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> {label}
                    </li>
                  ))}
                </ul>
              )}
            </header>

            {listing.description && (
              <Section id="about" title={`About this ${market === 'land' ? 'parcel' : 'place'}`}>
                <p className="max-w-3xl whitespace-pre-line leading-7 text-muted-foreground">
                  {listing.description}
                </p>
              </Section>
            )}

            {listing.facts.length > 0 && (
              <Section id="details" title="Details">
                <div className="rounded-xl border border-border bg-card px-5 shadow-xs">
                  <DescriptionList layout="rows" items={listing.facts} />
                </div>
              </Section>
            )}

            {listing.amenities.length > 0 && (
              <Section id="amenities" title="Amenities">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {listing.amenities.map((a) => (
                    <li
                      key={a}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 text-success" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {market !== 'land' && (
              <ShowroomNeighbourhood listingId={listing.id} title={listing.title} />
            )}

            <ShowroomTrust listing={listing} />
          </div>

          <ShowroomAside listing={listing} returnPath={path} />
        </div>

        {market !== 'land' ? (
          <SimilarListings
            listingId={listing.id}
            market={market}
            location={listing.location}
            price={listing.price}
            bedrooms={listing.bedrooms}
          />
        ) : null}
        {extra}
        {!listing.underOffer && (
          <>
            <div className="h-20" aria-hidden="true" />
            <StickyListingCta
              watchId="listing-cta"
              price={formatCurrency(listing.price)}
              priceUnit={listing.priceUnit}
              market={market}
              id={listing.id}
              returnPath={path}
            />
          </>
        )}
      </article>
      <Footer />
    </main>
  );
}
