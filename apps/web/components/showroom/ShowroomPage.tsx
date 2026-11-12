import type { ReactNode } from 'react';
import { BadgeCheck, Bath, BedDouble, Check, MapPin, Ruler } from '@sureground/icons';
import { trustChainLabel } from '@sureground/shared';
import { floorPlanLevels } from '@sureground/shared/showroom';
import { Badge, DescriptionList } from '@sureground/ui';
import { Breadcrumbs } from '@sureground/ui/Breadcrumbs';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, listingJsonLd } from '@/lib/structuredData';
import { SaveListingButton } from '@/components/market/SaveListingButton';
import { SimilarListings } from '@/components/market/SimilarListings';
import { StickyListingCta } from '@/components/market/StickyListingCta';
import { formatCurrency } from '@/lib/format';
import {
  MARKET_PATH,
  publicListingPath,
  resolvePublicListing,
  type PublicDetailMarket,
} from '@/lib/publicListingDetail';
import { ShowroomAside } from './ShowroomAside';
import { ShowroomCommercial } from './ShowroomCommercial';
import { ShowroomSection as Section } from './ShowroomSection';
import { ShowroomNeighbourhood } from './ShowroomNeighbourhood';
import { ShowroomQuestions } from './ShowroomQuestions';
import { ShowroomShareButton } from './ShowroomShareButton';
import { ShowroomTrust } from './ShowroomTrust';
import { VerificationSummaryBadge } from '@/components/shared/trust/VerificationSummaryCard';
import { TrustChainBadge } from '@/components/shared/trust/TrustChainBadge';
import { ListingInvestmentAnalysis } from '@/components/diaspora/analysis/ListingInvestmentAnalysis';
import {
  FloorPlansShortcut,
  ShowroomGallery,
  ShowroomMedia,
  TrackDetailView,
} from './ShowroomTracking';

const MARKET_NOUN: Record<PublicDetailMarket, string> = {
  rent: 'Rentals',
  sale: 'Homes for sale',
  land: 'Land',
};

export async function ShowroomPage({
  market,
  id,
  extra,
}: {
  market: PublicDetailMarket;
  id: string;
  extra?: ReactNode;
}) {
  const listing = await resolvePublicListing(market, id);

  const back = MARKET_PATH[market];
  const path = publicListingPath(listing);
  const keyFacts = [
    listing.bedrooms ? { icon: BedDouble, label: `${listing.bedrooms} bed` } : null,
    listing.bathrooms ? { icon: Bath, label: `${listing.bathrooms} bath` } : null,
    listing.size ? { icon: Ruler, label: `${listing.size} m²` } : null,
  ].filter((f): f is NonNullable<typeof f> => !!f);
  const floorPlans = floorPlanLevels(listing.media);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: MARKET_NOUN[market], path: back },
    { name: listing.title, path },
  ];

  return (
    <main className="min-h-screen bg-background pt-16">
      <JsonLd data={listingJsonLd(listing, path)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Navigation />
      <article className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ShowroomGallery>
          <Breadcrumbs
            items={crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }))}
            className="mb-0 min-h-10 py-2"
          />

          <TrackDetailView listingId={listing.id} market={market} />
          <ShowroomMedia
            listingId={listing.id}
            market={market}
            items={listing.media}
            floorPlans={listing.floorPlans}
            title={listing.title}
            className="-mx-4 mt-3 rounded-none shadow-none sm:mx-0 sm:rounded-2xl sm:shadow-sm"
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-14">
            <div className="min-w-0 space-y-10">
              <header className="space-y-3">
                {/* The trust chain is what the browse card shows, so the page reads the same. Without
                    one, the summary's status replaces the old "Verified" tick so the two never disagree. */}
                {listing.trustChain ? (
                  <a
                    href="#trust"
                    className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${trustChainLabel(listing.trustChain).label}. See what has been checked`}
                  >
                    <TrustChainBadge chain={listing.trustChain} />
                  </a>
                ) : listing.verificationSummary ? (
                  listing.verificationSummary.status !== 'NOT_STARTED' && (
                    // The badge never stands alone: it leads to what was checked and what it does not cover.
                    <a
                      href="#trust"
                      className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="See what was checked and what it does not cover"
                    >
                      <VerificationSummaryBadge summary={listing.verificationSummary} />
                    </a>
                  )
                ) : (
                  listing.verified && (
                    <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                      {market === 'land' ? 'Ownership verified' : 'Verified'}
                    </Badge>
                  )
                )}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground text-balance sm:text-4xl">
                    {listing.title}
                  </h1>
                  <div className="flex shrink-0 gap-2">
                    <ShowroomShareButton listingId={listing.id} title={listing.title} path={path} />
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
                {(keyFacts.length > 0 || floorPlans.length > 0) && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
                    {keyFacts.length > 0 && (
                      <ul
                        aria-label="Key facts"
                        className="flex flex-wrap items-center gap-y-2 divide-x divide-border text-sm font-medium text-foreground"
                      >
                        {keyFacts.map(({ icon: Icon, label }) => (
                          <li key={label} className="flex items-center gap-2 px-4 first:pl-0">
                            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{' '}
                            {label}
                          </li>
                        ))}
                      </ul>
                    )}
                    {floorPlans.length > 0 && (
                      <FloorPlansShortcut
                        listingId={listing.id}
                        market={market}
                        firstIndex={floorPlans[0]!.index}
                        count={floorPlans.length}
                      />
                    )}
                  </div>
                )}
              </header>

              {/* Commercial: the lease and the space come before the description. */}
              {listing.commercial && (
                <ShowroomCommercial commercial={listing.commercial} market={market} />
              )}

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

              <ShowroomQuestions listing={listing} returnPath={path} />

              {market !== 'land' && (
                <ShowroomNeighbourhood listingId={listing.id} title={listing.title} />
              )}

              <ShowroomTrust listing={listing} />

              {/* DIA-19: only where the checks make the listing investment eligible. */}
              {market !== 'rent' &&
                listing.verificationSummary?.status === 'INVESTMENT_ELIGIBLE' && (
                  <ListingInvestmentAnalysis listingId={listing.id} />
                )}
            </div>

            <ShowroomAside listing={listing} returnPath={path} />
          </div>

          <SimilarListings listingId={listing.id} market={market} />
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
                commercial={!!listing.commercial}
              />
            </>
          )}
        </ShowroomGallery>
      </article>
      <Footer />
    </main>
  );
}
