import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { ShortletListingDetail } from '@/components/shortlet/ShortletListingDetail';
import { breadcrumbJsonLd } from '@/lib/structuredData';
import { publicFetchInit } from '@/lib/publicFetch';
import { SITE_URL } from '@/lib/site';
import { listingIdFromSegment, listingPath, listingSegment } from '@/lib/listingSlug';
import type { ShortletListing } from '@/types/shortlet';

// Must be a literal for Next to read it; matches PUBLIC_REVALIDATE.
export const revalidate = 60;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchListing(id: string): Promise<ShortletListing | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/shortlets/${id}`, publicFetchInit());
    if (!res.ok) return null;
    return (await res.json()) as ShortletListing;
  } catch {
    return null;
  }
}

interface ShortletDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ShortletDetailPageProps): Promise<Metadata> {
  const { id: segment } = await params;
  const listing = await fetchListing(listingIdFromSegment(segment));

  if (!listing) {
    return { title: 'Shortlet not found', robots: { index: false, follow: false } };
  }

  const description =
    listing.description ||
    `Book ${listing.title} in ${listing.city}, ${listing.state} on Sureground. Verified host, payments protected by Sureground.`;

  return {
    title: `${listing.title}: ${listing.city}, ${listing.state}`,
    description,
    alternates: { canonical: listingPath('shortlet', listing.id, listing.title) },
    openGraph: {
      title: `${listing.title}: ${listing.city}, ${listing.state}`,
      description,
      url: `${SITE_URL}${listingPath('shortlet', listing.id, listing.title)}`,
      type: 'website',
      images: listing.coverImageUrl ? [listing.coverImageUrl] : undefined,
    },
  };
}

export default async function ShortletDetailPage({ params }: ShortletDetailPageProps) {
  const { id: segment } = await params;
  const id = listingIdFromSegment(segment);
  const listing = await fetchListing(id);
  // Not loaded on the server (missing or API down): the client view shows the right state and retries.
  if (!listing)
    return (
      <Shell>
        <ShortletListingDetail listingId={id} />
      </Shell>
    );
  if (decodeSafe(segment) !== listingSegment(listing.id, listing.title)) {
    permanentRedirect(listingPath('shortlet', listing.id, listing.title));
  }
  const path = listingPath('shortlet', listing.id, listing.title);
  return (
    <Shell>
      <JsonLd data={stayJsonLd(listing, path)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Short stays', path: '/shortlets' },
          { name: listing.title, path },
        ])}
      />
      <ShortletListingDetail listingId={listing.id} initialListing={listing} />
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      {children}
      <Footer />
    </main>
  );
}

// The stay's area only: the exact address comes with a paid booking, so it never goes in the page data.
function stayJsonLd(listing: ShortletListing, path: string) {
  const url = `${SITE_URL}${path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: listing.title,
    ...(listing.description ? { description: listing.description } : {}),
    url,
    ...(listing.images.length ? { image: listing.images.slice(0, 6) } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.city,
      addressRegion: listing.state,
      addressCountry: 'NG',
    },
    occupancy: { '@type': 'QuantitativeValue', maxValue: listing.maxGuests },
    ...(listing.reviewCount > 0 && listing.ratingAverage
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: listing.ratingAverage,
            reviewCount: listing.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
    ...(listing.nightlyRate
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'NGN',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: listing.nightlyRate,
              priceCurrency: 'NGN',
              unitCode: 'DAY',
              unitText: 'night',
            },
          },
        }
      : {}),
  };
}

function decodeSafe(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
