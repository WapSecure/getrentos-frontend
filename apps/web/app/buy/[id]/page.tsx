import type { Metadata } from 'next';
import { PublicListingPage, publicListingMetadata } from '@/components/market/PublicListingPage';
import { ShowroomPage } from '@/components/showroom/ShowroomPage';
import { showroomEnabled } from '@/lib/showroom';

// Must be a literal for Next to read it; matches PUBLIC_DETAIL_REVALIDATE.
export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return publicListingMetadata('sale', (await params).id);
}

export default async function SaleListingPage({ params }: Props) {
  const Page = showroomEnabled() ? ShowroomPage : PublicListingPage;
  return <Page market="sale" id={(await params).id} />;
}
