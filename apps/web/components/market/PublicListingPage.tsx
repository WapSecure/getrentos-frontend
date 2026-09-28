import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Check,
  Lock,
  MapPin,
  Ruler,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { SaveListingButton } from '@/components/market/SaveListingButton';
import { SimilarListings } from '@/components/market/SimilarListings';
import { formatCurrency } from '@/lib/format';
import { SITE_URL } from '@/lib/site';
import {
  fetchPublicListing,
  MARKET_PATH,
  type PublicDetailMarket,
  type PublicListingDetail,
} from '@/lib/publicListingDetail';

const MARKET_NOUN: Record<PublicDetailMarket, string> = {
  rent: 'Rentals',
  sale: 'Homes for sale',
  land: 'Land',
};

const CTA: Record<PublicDetailMarket, string> = {
  rent: 'Sign in to enquire',
  sale: 'Sign in to make an offer',
  land: 'Sign in to make an offer',
};

/** Shared `generateMetadata` for the three public detail routes. */
export async function publicListingMetadata(
  market: PublicDetailMarket,
  id: string
): Promise<Metadata> {
  const listing = await fetchPublicListing(market, id);
  if (!listing) return { title: 'Listing not found', robots: { index: false } };
  const path = `${MARKET_PATH[market]}/${id}`;
  const description =
    listing.description?.slice(0, 160) ||
    `${listing.title} in ${listing.location} — verified listing on GetRentos with payment protection.`;
  return {
    title: `${listing.title} — ${listing.location}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${listing.title} — ${listing.location}`,
      description,
      url: `${SITE_URL}${path}`,
      type: 'website',
      images: listing.images[0] ? [listing.images[0]] : undefined,
    },
  };
}

/**
 * A public listing page: server-rendered so a shared link previews properly and
 * a crawler sees the listing, with the one thing a visitor can't do signed out —
 * contact or pay — handed to sign-in.
 */
export async function PublicListingPage({
  market,
  id,
}: {
  market: PublicDetailMarket;
  id: string;
}) {
  const listing = await fetchPublicListing(market, id);
  if (!listing) notFound();

  const back = MARKET_PATH[market];
  const next = encodeURIComponent(`${back}/${id}`);

  return (
    <main className="min-h-screen bg-background pt-16">
      <JsonLd data={offerJsonLd(listing)} />
      <Navigation />
      <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={back}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {MARKET_NOUN[market]}
        </Link>

        <Gallery listing={listing} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-14">
          <div className="space-y-10">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {listing.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
                  {listing.title}
                </h1>
                <SaveListingButton
                  listingId={listing.id}
                  returnPath={`${back}/${id}`}
                  className="shrink-0 border-border bg-card text-foreground hover:bg-muted focus-visible:ring-primary"
                />
              </div>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                <span>
                  {listing.address ? `${listing.address}, ${listing.location}` : listing.location}
                </span>
              </p>
              {(listing.bedrooms || listing.bathrooms || listing.size) && (
                <ul className="flex flex-wrap gap-3 pt-2 text-sm text-foreground">
                  {listing.bedrooms ? (
                    <li className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 shadow-sm">
                      <BedDouble className="h-4 w-4 text-primary" /> {listing.bedrooms} bed
                    </li>
                  ) : null}
                  {listing.bathrooms ? (
                    <li className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 shadow-sm">
                      <Bath className="h-4 w-4 text-primary" /> {listing.bathrooms} bath
                    </li>
                  ) : null}
                  {listing.size ? (
                    <li className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 shadow-sm">
                      <Ruler className="h-4 w-4 text-primary" /> {listing.size} m²
                    </li>
                  ) : null}
                </ul>
              )}
            </header>

            {listing.description && (
              <section aria-labelledby="about" className="border-t border-border/70 pt-8">
                <h2 id="about" className="text-xl font-semibold tracking-tight text-foreground">
                  About this {market === 'land' ? 'parcel' : 'place'}
                </h2>
                <p className="mt-3 max-w-3xl whitespace-pre-line leading-7 text-muted-foreground">
                  {listing.description}
                </p>
              </section>
            )}

            {listing.facts.length > 0 && (
              <section aria-labelledby="details" className="border-t border-border/70 pt-8">
                <h2 id="details" className="text-xl font-semibold tracking-tight text-foreground">
                  Details
                </h2>
                <dl className="mt-4 grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm sm:grid-cols-2">
                  {listing.facts.map((f) => (
                    <div
                      key={f.label}
                      className="flex justify-between gap-6 border-b border-border/70 px-5 py-4 text-sm last:border-b-0 sm:odd:border-r"
                    >
                      <dt className="text-muted-foreground">{f.label}</dt>
                      <dd className="text-right font-medium text-foreground">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {listing.amenities.length > 0 && (
              <section aria-labelledby="amenities" className="border-t border-border/70 pt-8">
                <h2 id="amenities" className="text-xl font-semibold tracking-tight text-foreground">
                  Amenities
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {listing.amenities.map((a) => (
                    <li
                      key={a}
                      className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 text-success" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5 rounded-3xl border border-primary/15 bg-card p-6 shadow-xl shadow-primary/5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {market === 'rent' ? 'Rental price' : 'Asking price'}
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(listing.price)}
                {listing.priceUnit && (
                  <span className="text-base font-normal text-muted-foreground">
                    /{listing.priceUnit}
                  </span>
                )}
              </p>

              <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Listed price</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(listing.price)}
                  </span>
                </div>
                {listing.market === 'rent' && listing.priceUnit ? (
                  <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-2">
                    <span className="text-muted-foreground">
                      {listing.priceUnit === 'year' ? 'Monthly equivalent' : 'Annual equivalent'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(
                        listing.priceUnit === 'year' ? listing.price / 12 : listing.price * 12
                      )}
                    </span>
                  </div>
                ) : null}
                <p className="border-t border-border/70 pt-2 text-xs leading-5 text-muted-foreground">
                  Additional legal, agency, service or transaction fees are excluded unless stated
                  in the listing. Confirm the full breakdown before paying.
                </p>
              </div>

              {listing.host && (
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{listing.host.label}</p>
                    <p className="truncate font-semibold text-foreground">{listing.host.name}</p>
                    {listing.host.rating ? (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {listing.host.rating.toFixed(1)}
                        {listing.host.reviews ? ` · ${listing.host.reviews} reviews` : ''}
                      </p>
                    ) : null}
                  </div>
                  {listing.host.verified && (
                    <ShieldCheck className="h-5 w-5 text-emerald-600" aria-label="Verified" />
                  )}
                </div>
              )}

              <Link
                href={`/login?next=${next}`}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {CTA[market]}
              </Link>
              <Link
                href={`/signup?next=${next}`}
                className="block text-center text-sm font-medium text-primary hover:underline"
              >
                New here? Create a free account
              </Link>

              <div className="space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Pay through GetRentos — we hold your money until both sides confirm.
                </p>
                <p className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  Never pay outside GetRentos or share sensitive financial details.
                </p>
              </div>
            </div>
          </aside>
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
      </article>
      <Footer />
    </main>
  );
}

function Gallery({ listing }: { listing: PublicListingDetail }) {
  const [cover, ...rest] = listing.images;
  if (!cover) {
    return (
      <div className="mt-5 flex h-72 items-center justify-center rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/15 via-accent to-primary/5 text-sm font-medium text-muted-foreground sm:h-[30rem]">
        Photos are being prepared for this listing
      </div>
    );
  }
  return (
    <div className="relative mt-5 grid h-[24rem] gap-2 overflow-hidden rounded-3xl bg-muted shadow-lg sm:h-[31rem] sm:grid-cols-4 sm:grid-rows-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URLs, not optimisable */}
      <img
        src={cover}
        alt={listing.title}
        className="h-full w-full object-cover transition duration-500 hover:scale-[1.02] sm:col-span-2 sm:row-span-2"
      />
      {rest.slice(0, 4).map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`${listing.title}, photo ${i + 2}`}
          loading="lazy"
          className="hidden h-full w-full object-cover transition duration-500 hover:scale-[1.03] sm:block"
        />
      ))}
      <span className="absolute bottom-4 right-4 rounded-full border border-white/30 bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
        {listing.images.length} {listing.images.length === 1 ? 'photo' : 'photos'}
      </span>
    </div>
  );
}

function offerJsonLd(listing: PublicListingDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: listing.title,
    description: listing.description,
    price: listing.price,
    priceCurrency: 'NGN',
    url: `${SITE_URL}${MARKET_PATH[listing.market]}/${listing.id}`,
    image: listing.images[0],
    availableAtOrFrom: { '@type': 'Place', address: listing.address || listing.location },
  };
}
