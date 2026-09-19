import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { PublicMarketBrowser } from '@/components/market/PublicMarketBrowser';
import { firstPagePath, rentToCard, type PublicListingCard, type RentApiItem } from '@/lib/publicListingMap';
import type { Paginated } from '@/lib/apiHelpers';

export const metadata: Metadata = {
  title: 'Homes to Rent in Nigeria',
  description:
    'Browse rental homes across Nigeria. Verified properties and verified landlords are marked, and you can scope results to a single estate.',
  alternates: { canonical: '/rent' },
  openGraph: {
    title: 'Homes to Rent in Nigeria',
    description: 'Browse rental homes across Nigeria — verified properties, verified landlords, escrow-protected.',
    url: '/rent',
    type: 'website',
  },
};

/**
 * Pre-render the first page on the server.
 *
 * A public market exists to be found, so the listings — not just the heading —
 * need to be in the HTML a crawler receives. The mapping is shared with the
 * client service, so the server-rendered cards and the hydrated ones are built by
 * the same code. A failure returns null and the client refetches, so this
 * degrades to "loading" rather than erroring the page.
 */
async function fetchFirstPage(): Promise<Paginated<PublicListingCard> | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}${firstPagePath('rent')}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as Paginated<RentApiItem>;
    return { ...data, items: data.items.map(rentToCard) };
  } catch {
    return null;
  }
}

export default async function RentMarketplacePage() {
  const initialData = await fetchFirstPage();

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <PublicMarketBrowser market="rent" initialData={initialData ?? undefined} />
      <Footer />
    </main>
  );
}
