import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { ShortletMarketplaceBrowser } from '@/components/shortlet/ShortletMarketplaceBrowser';
import { ListingItemListJsonLd } from '@/components/seo/ListingItemListJsonLd';
import { fetchFirstPage, isFilteredView, shortletFirstPagePath } from '@/lib/marketFirstPage';
import type { ShortletListing } from '@/types/shortlet';

const baseMetadata: Metadata = {
  title: 'Shortlets: Furnished Short-Stay Apartments',
  description:
    'Book furnished short-stay apartments and homes in Nigeria. See the total before you pay; Sureground holds your payment until at least 24 hours after check-in.',
  alternates: { canonical: '/shortlets' },
  openGraph: {
    title: 'Shortlets: Furnished Short-Stay Apartments',
    description:
      'Book furnished short-stay apartments and homes in Nigeria. See the total before you pay, with your payment held until after check-in.',
    url: '/shortlets',
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

export default async function ShortletMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The browser only uses it for the unfiltered view; the item list is only for the indexable page.
  const [filtered, initialData] = await Promise.all([
    searchParams.then(isFilteredView),
    fetchFirstPage(shortletFirstPagePath(), (item: ShortletListing) => item),
  ]);

  return (
    <main className="min-h-screen bg-background pt-16">
      {!filtered && initialData && (
        <ListingItemListJsonLd kind="shortlet" listings={initialData.items} />
      )}
      <Navigation />
      <ShortletMarketplaceBrowser initialData={initialData ?? undefined} />
      <Footer />
    </main>
  );
}
