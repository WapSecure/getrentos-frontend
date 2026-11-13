import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { PublicMarketBrowser } from '@/components/market/PublicMarketBrowser';
import { firstPagePath, rentToCard } from '@/lib/publicListingMap';
import { ListingItemListJsonLd } from '@/components/seo/ListingItemListJsonLd';
import { fetchFirstPage, isFilteredView } from '@/lib/marketFirstPage';
import { SITE_OG_IMAGES } from '@/lib/site';

const baseMetadata: Metadata = {
  title: 'Homes to Rent in Nigeria',
  description:
    'Browse rental homes across Nigeria. Verified properties and verified landlords are marked, and you can scope results to a single estate.',
  alternates: { canonical: '/rent' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: 'Homes to Rent in Nigeria',
    description:
      'Browse rental homes across Nigeria, see what Sureground has checked on each one, and pay through Sureground Payment Protection.',
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

export default async function RentMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The browser only uses it for the unfiltered view; the item list is only for the indexable page.
  const [filtered, initialData] = await Promise.all([
    searchParams.then(isFilteredView),
    fetchFirstPage(firstPagePath('rent'), rentToCard),
  ]);

  return (
    <main className="min-h-screen bg-background pt-16">
      {!filtered && initialData && (
        <ListingItemListJsonLd kind="rent" listings={initialData.items} />
      )}
      <Navigation />
      <PublicMarketBrowser market="rent" initialData={initialData ?? undefined} />
      <Footer />
    </main>
  );
}
