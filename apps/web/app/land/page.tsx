import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LandMarketplaceBrowser } from '@/components/land/LandMarketplaceBrowser';

export const metadata: Metadata = {
  title: 'Land: Reviewed Land Listings',
  description:
    'Browse land listings with a dated diligence review that shows what was checked, and payments held until you confirm each step.',
  alternates: { canonical: '/land' },
  openGraph: {
    title: 'Land: Reviewed Land Listings',
    description: 'Browse land listings with a dated, scoped diligence review on GetRentos.',
    url: '/land',
    type: 'website',
  },
};

export default function LandMarketplacePage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <LandMarketplaceBrowser mode="public" />
      <Footer />
    </main>
  );
}
