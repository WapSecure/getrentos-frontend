import type { Metadata } from 'next';
import { PublicListingPage, publicListingMetadata } from '@/components/market/PublicListingPage';

// Must be a literal for Next to read it; matches PUBLIC_DETAIL_REVALIDATE.
export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return publicListingMetadata('land', (await params).id);
}

export default async function LandListingPage({ params }: Props) {
  return <PublicListingPage market="land" id={(await params).id} />;
}
