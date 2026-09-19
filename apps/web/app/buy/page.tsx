import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { PublicMarketBrowser } from '@/components/market/PublicMarketBrowser';
import { firstPagePath, saleToCard, type PublicListingCard, type SaleApiItem } from '@/lib/publicListingMap';
import type { Paginated } from '@/lib/apiHelpers';

export const metadata: Metadata = {
  title: 'Properties for Sale in Nigeria',
  description:
    'Browse homes for sale across Nigeria. Verified properties, escrow-protected payments, and results you can scope to a single estate.',
  alternates: { canonical: '/buy' },
  openGraph: {
    title: 'Properties for Sale in Nigeria',
    description: 'Browse homes for sale across Nigeria, with escrow-protected payments.',
    url: '/buy',
    type: 'website',
  },
};

/** Same reasoning as /rent: the listings themselves belong in the HTML a crawler
 * receives, built by the same mapping the client uses. */
async function fetchFirstPage(): Promise<Paginated<PublicListingCard> | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}${firstPagePath('sale')}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as Paginated<SaleApiItem>;
    return { ...data, items: data.items.map(saleToCard) };
  } catch {
    return null;
  }
}

export default async function BuyMarketplacePage() {
  const initialData = await fetchFirstPage();

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <PublicMarketBrowser market="sale" initialData={initialData ?? undefined} />
      <Footer />
    </main>
  );
}
