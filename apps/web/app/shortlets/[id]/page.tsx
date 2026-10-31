import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShortletListingDetail } from '@/components/shortlet/ShortletListingDetail';
import { SITE_URL } from '@/lib/site';
import { isTransientStatus, PublicListingUnavailableError } from '@/lib/publicListingDetail';
import type { ShortletListing } from '@/types/shortlet';

/**
 * ISR: listing pages are cached after the first request and revalidated in the
 * background every hour. This keeps the page fast and crawlable while staying
 * fresh as hosts update availability/pricing.
 */
export const revalidate = 3600;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * The listing, or `null` when it does not exist. An unreachable or failing API
 * throws instead, so an outage shows the error boundary rather than a 404.
 */
async function fetchListing(id: string): Promise<ShortletListing | null> {
  const path = `/shortlets/${encodeURIComponent(id)}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate } });
  } catch {
    throw new PublicListingUnavailableError(path);
  }
  if (res.ok) return (await res.json()) as ShortletListing;
  if (isTransientStatus(res.status)) throw new PublicListingUnavailableError(path, res.status);
  return null;
}

interface ShortletDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ShortletDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    return { title: 'Shortlet not found', robots: { index: false } };
  }

  const description =
    listing.description ||
    `Book ${listing.title} in ${listing.city}, ${listing.state} on GetRentos. Verified host, payments protected by GetRentos.`;

  return {
    title: `${listing.title}: ${listing.city}, ${listing.state}`,
    description,
    alternates: { canonical: `/shortlets/${id}` },
    openGraph: {
      title: `${listing.title}: ${listing.city}, ${listing.state}`,
      description,
      url: `${SITE_URL}/shortlets/${id}`,
      type: 'website',
      images: listing.coverImageUrl ? [listing.coverImageUrl] : undefined,
    },
  };
}

export default async function ShortletDetailPage({ params }: ShortletDetailPageProps) {
  const { id } = await params;
  // Pre-fetch the listing server-side so the page renders with real content
  // (better SEO + LCP) and the client query hydrates instantly.
  const listing = await fetchListing(id);
  if (!listing) notFound();
  return <ShortletListingDetail listingId={id} initialListing={listing} />;
}
