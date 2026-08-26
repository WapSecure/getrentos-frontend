import type { Metadata } from 'next';
import { ShortletListingDetail } from '@/components/shortlet/ShortletListingDetail';

export const metadata: Metadata = {
  title: 'Shortlet stay',
  description: 'Book a furnished short-stay apartment or home.',
};

export default async function ShortletDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShortletListingDetail listingId={id} />;
}
