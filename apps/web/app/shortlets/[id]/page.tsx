import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { ShortletListingDetail } from '@/components/shortlet/ShortletListingDetail';
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
  if (!listing) return <ShortletListingDetail listingId={id} />;
  if (decodeSafe(segment) !== listingSegment(listing.id, listing.title)) {
    permanentRedirect(listingPath('shortlet', listing.id, listing.title));
  }
  return <ShortletListingDetail listingId={listing.id} initialListing={listing} />;
}

function decodeSafe(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
