import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { PublicMarketBrowser } from '@/components/market/PublicMarketBrowser';

export const metadata: Metadata = {
  title: 'Homes to Rent in Nigeria | GetRentos',
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

export default function RentMarketplacePage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <PublicMarketBrowser market="rent" />
      <Footer />
    </main>
  );
}
