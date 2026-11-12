import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LandMarketplaceBrowser } from '@/components/land/LandMarketplaceBrowser';

const baseMetadata: Metadata = {
  title: 'Land: Reviewed Land Listings',
  description:
    'Browse land listings with a dated diligence review that shows what was checked, and payments held until you confirm each step.',
  alternates: { canonical: '/land' },
  openGraph: {
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

export default function LandMarketplacePage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <LandMarketplaceBrowser mode="public" />
      <Footer />
    </main>
  );
}
