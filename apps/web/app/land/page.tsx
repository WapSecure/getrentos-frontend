import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LandMarketplaceBrowser } from '@/components/land/LandMarketplaceBrowser';

export const metadata: Metadata = {
  title: 'Land — Verified Land Listings',
  description:
    'Browse verified land listings with title deed verification. Buy land securely with escrow-protected payments on GetRentos.',
  alternates: { canonical: '/land' },
  openGraph: {
    title: 'Land — Verified Land Listings',
    description: 'Browse verified land listings with title deed verification on GetRentos.',
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
