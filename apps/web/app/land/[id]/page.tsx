import type { Metadata } from 'next';
import { PublicListingPage, publicListingMetadata } from '@/components/market/PublicListingPage';
import { ShowroomPage } from '@/components/showroom/ShowroomPage';
import { showroomEnabled } from '@/lib/showroom';
import { ListingMarketSection } from '@/components/land/market/ListingMarketSection';

// Must be a literal for Next to read it; matches PUBLIC_DETAIL_REVALIDATE.
export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return publicListingMetadata('land', (await params).id);
}

export default async function LandListingPage({ params }: Props) {
  const { id } = await params;
  const Page = showroomEnabled() ? ShowroomPage : PublicListingPage;
  return <Page market="land" id={id} extra={<ListingMarketSection listingId={id} />} />;
}
