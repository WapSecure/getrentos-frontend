import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LandMarketplaceBrowser } from '@/components/land/LandMarketplaceBrowser';
import { ListingItemListJsonLd } from '@/components/seo/ListingItemListJsonLd';
import { fetchFirstPage, isFilteredView, landFirstPagePath } from '@/lib/marketFirstPage';
import { mapPublicLand } from '@/lib/publicLandMap';
import { SITE_OG_IMAGES } from '@/lib/site';

const baseMetadata: Metadata = {
  title: 'Land: Reviewed Land Listings',
  description:
    'Browse land listings with a dated diligence review that shows what was checked, and payments held until you confirm each step.',
  alternates: { canonical: '/land' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: 'Land: Reviewed Land Listings',
    description: 'Browse land listings with a dated, scoped diligence review on Sureground.',
    url: '/land',
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

export default async function LandMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The browser only uses it for the unfiltered view; the item list is only for the indexable page.
  // When land is off the layout's gate shows its notice in place of this page.
  const [filtered, initialData] = await Promise.all([
    searchParams.then(isFilteredView),
    fetchFirstPage(landFirstPagePath(), mapPublicLand),
  ]);

  return (
    <main className="min-h-screen bg-background pt-16">
      {!filtered && initialData && (
        <ListingItemListJsonLd kind="land" listings={initialData.items} />
      )}
      <Navigation />
      <LandMarketplaceBrowser mode="public" initialData={initialData ?? undefined} />
      <Footer />
    </main>
  );
}
