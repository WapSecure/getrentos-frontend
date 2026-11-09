import type { Metadata } from 'next';
import { ShortletListingDetail } from '@/components/shortlet/ShortletListingDetail';
import { SITE_URL } from '@/lib/site';
import type { ShortletListing } from '@/types/shortlet';

export const revalidate = 3600;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchListing(id: string): Promise<ShortletListing | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/shortlets/${id}`, {
      next: { revalidate },
    });
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
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    return { title: 'Shortlet not found' };
  }

  const description =
    listing.description ||
    `Book ${listing.title} in ${listing.city}, ${listing.state} on Sureground. Verified host, payments protected by Sureground.`;

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
  const listing = await fetchListing(id);
  return <ShortletListingDetail listingId={id} initialListing={listing ?? undefined} />;
}
