import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { OPTIONAL_FETCH_TIMEOUT_MS, publicFetchInit } from '@/lib/publicFetch';
import { Navigation } from '@/components/layout/Navigation';
import { PublicMarketBrowser } from '@/components/market/PublicMarketBrowser';
import {
  firstPagePath,
  rentToCard,
  type PublicListingCard,
  type RentApiItem,
} from '@/lib/publicListingMap';
import type { Paginated } from '@/lib/apiHelpers';

const baseMetadata: Metadata = {
  title: 'Homes to Rent in Nigeria',
  description:
    'Browse rental homes across Nigeria. Verified properties and verified landlords are marked, and you can scope results to a single estate.',
  alternates: { canonical: '/rent' },
  openGraph: {
    title: 'Homes to Rent in Nigeria',
    description:
      'Browse rental homes across Nigeria with verified properties, verified landlords and Sureground Payment Protection.',
    url: '/rent',
    type: 'website',
  },
};

// Filtered and searched views share the unfiltered page's canonical and stay out of the index,
// so query strings can't multiply into thin duplicate pages; links on them are still followed.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Object.values(params).some((value) => value !== undefined && value !== '');
  return filtered ? { ...baseMetadata, robots: { index: false, follow: true } } : baseMetadata;
}

async function fetchFirstPage(): Promise<Paginated<PublicListingCard> | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // A slow API leaves the list to the browser's own fetch rather than holding back the page.
    const res = await fetch(
      `${apiUrl}${firstPagePath('rent')}`,
      publicFetchInit({ timeoutMs: OPTIONAL_FETCH_TIMEOUT_MS })
    );
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
