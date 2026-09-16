import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { PublicMarketBrowser } from '@/components/market/PublicMarketBrowser';

export const metadata: Metadata = {
  title: 'Properties for Sale in Nigeria | GetRentos',
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

export default function BuyMarketplacePage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <PublicMarketBrowser market="sale" />
      <Footer />
    </main>
  );
}
