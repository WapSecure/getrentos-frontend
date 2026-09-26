import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Lock,
  MapPin,
  Ruler,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { JsonLd } from '@/components/seo/JsonLd';
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
    `${listing.title} in ${listing.location} — verified listing on GetRentos, paid through escrow.`;
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
      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={back}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {MARKET_NOUN[market]}
        </Link>

        <Gallery listing={listing} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {listing.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
                {listing.title}
              </h1>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                <span>
                  {listing.address ? `${listing.address}, ${listing.location}` : listing.location}
                </span>
              </p>
              {(listing.bedrooms || listing.bathrooms || listing.size) && (
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
                  {listing.bedrooms ? (
                    <li className="flex items-center gap-1.5">
                      <BedDouble className="h-4 w-4 text-muted-foreground" /> {listing.bedrooms} bed
                    </li>
                  ) : null}
                  {listing.bathrooms ? (
                    <li className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4 text-muted-foreground" /> {listing.bathrooms} bath
                    </li>
                  ) : null}
                  {listing.size ? (
                    <li className="flex items-center gap-1.5">
                      <Ruler className="h-4 w-4 text-muted-foreground" /> {listing.size} m²
                    </li>
                  ) : null}
                </ul>
              )}
            </header>

            {listing.description && (
              <section aria-labelledby="about">
                <h2 id="about" className="text-lg font-semibold text-foreground">
                  About this {market === 'land' ? 'parcel' : 'place'}
                </h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {listing.description}
                </p>
              </section>
            )}

            {listing.facts.length > 0 && (
              <section aria-labelledby="details">
                <h2 id="details" className="text-lg font-semibold text-foreground">
                  Details
                </h2>
                <dl className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {listing.facts.map((f) => (
                    <div key={f.label} className="flex justify-between gap-6 px-5 py-3 text-sm">
                      <dt className="text-muted-foreground">{f.label}</dt>
                      <dd className="text-right font-medium text-foreground">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {listing.amenities.length > 0 && (
              <section aria-labelledby="amenities">
                <h2 id="amenities" className="text-lg font-semibold text-foreground">
                  Amenities
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <li
                      key={a}
                      className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(listing.price)}
                {listing.priceUnit && (
                  <span className="text-base font-normal text-muted-foreground">
                    /{listing.priceUnit}
                  </span>
                )}
              </p>

              {listing.host && (
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
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
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {CTA[market]}
              </Link>
              <Link
                href={`/signup?next=${next}`}
                className="block text-center text-sm font-medium text-primary hover:underline"
              >
                New here? Create a free account
              </Link>

              <p className="flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Pay through GetRentos escrow — your money is held until both sides confirm.
              </p>
            </div>
          </aside>
        </div>
      </article>
      <Footer />
    </main>
  );
}

function Gallery({ listing }: { listing: PublicListingDetail }) {
  const [cover, ...rest] = listing.images;
  if (!cover) {
    return (
      <div className="mt-4 flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-sm text-muted-foreground">
        No photos for this listing yet
      </div>
    );
  }
  return (
    <div className="mt-4 grid h-[22rem] gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URLs, not optimisable */}
      <img
        src={cover}
        alt={listing.title}
        className="h-full w-full object-cover sm:col-span-2 sm:row-span-2"
      />
      {rest.slice(0, 4).map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`${listing.title}, photo ${i + 2}`}
          loading="lazy"
          className="hidden h-full w-full object-cover sm:block"
        />
      ))}
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
