import type { ReactNode } from 'react';
import { BadgeCheck, Bath, BedDouble, Check, MapPin, Ruler } from '@sureground/icons';
import { trustChainLabel } from '@sureground/shared';
import { floorPlanLevels } from '@sureground/shared/showroom';
import { Badge } from '@sureground/ui/Badge';
import { DescriptionList } from '@sureground/ui/DescriptionList';
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
import { IconTile } from '@/components/marketing/IconTile';
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
    listing.bedrooms
      ? { icon: BedDouble, label: `${listing.bedrooms} bed`, name: 'Bedrooms' }
      : null,
    listing.bathrooms
      ? { icon: Bath, label: `${listing.bathrooms} bath`, name: 'Bathrooms' }
      : null,
    listing.size ? { icon: Ruler, label: `${listing.size} m²`, name: 'Size' } : null,
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
                    <Badge
                      className="border-primary bg-primary text-primary-foreground"
                      icon={<BadgeCheck className="h-3.5 w-3.5" />}
                    >
                      {market === 'land' ? 'Ownership verified' : 'Verified'}
                    </Badge>
                  )
                )}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="font-display text-[2.125rem] leading-[1.08] font-light tracking-[-0.015em] text-balance text-foreground sm:text-[2.75rem] lg:text-[3.25rem]">
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
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    {listing.address ? `${listing.address}, ${listing.location}` : listing.location}
                  </span>
                </p>
                {/* Phones see the price here; the full breakdown sits further down. */}
                <p className="font-display data-value text-[2rem] leading-tight font-normal tracking-[-0.015em] text-foreground lg:hidden">
                  {formatCurrency(listing.price)}
                  {listing.priceUnit && (
                    <span className="font-sans text-base font-normal text-muted-foreground">
                      /{listing.priceUnit}
                    </span>
                  )}
                </p>
                {(keyFacts.length > 0 || floorPlans.length > 0) && (
                  <div className="flex flex-col gap-4 pt-3">
                    {keyFacts.length > 0 && (
                      <ul
                        aria-label="Key facts"
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
                      >
                        {keyFacts.map(({ icon, label, name }) => (
                          <li
                            key={label}
                            className="flex items-center gap-3 rounded-md border border-border bg-card p-3 sm:p-4"
                          >
                            <IconTile icon={icon} size="sm" />
                            <span className="flex min-w-0 flex-col">
                              <span className="label-caps text-muted-foreground">{name}</span>
                              <span className="text-[0.9375rem] font-semibold text-foreground tabular-nums">
                                {label}
                              </span>
                            </span>
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
                  <div className="rounded-md border border-border bg-card px-5">
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
                        className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
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
          {!listing.underOffer && !listing.notAcceptingApplications && (
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
