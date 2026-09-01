import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { ShortletMarketplaceBrowser } from '@/components/shortlet/ShortletMarketplaceBrowser';

export const metadata: Metadata = {
  title: 'Shortlets — Furnished Short-Stay Apartments',
  description:
    'Book verified, furnished short-stay apartments and homes. Escrow-secured payments, verified hosts, and instant confirmation on GetRentos.',
  alternates: { canonical: '/shortlets' },
  openGraph: {
    title: 'Shortlets — Furnished Short-Stay Apartments',
    description: 'Book verified, furnished short-stay apartments and homes on GetRentos.',
    url: '/shortlets',
    type: 'website',
  },
};

export default function ShortletMarketplacePage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <ShortletMarketplaceBrowser />
      <Footer />
    </main>
  );
}
