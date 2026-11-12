import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { ShortletMarketplaceBrowser } from '@/components/shortlet/ShortletMarketplaceBrowser';

const baseMetadata: Metadata = {
  title: 'Shortlets: Furnished Short-Stay Apartments',
  description:
    'Book verified, furnished short-stay apartments and homes. Your payment is held by Sureground until you arrive, verified hosts, and instant confirmation on Sureground.',
  alternates: { canonical: '/shortlets' },
  openGraph: {
    title: 'Shortlets: Furnished Short-Stay Apartments',
    description: 'Book verified, furnished short-stay apartments and homes on Sureground.',
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

export default function ShortletMarketplacePage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <ShortletMarketplaceBrowser />
      <Footer />
    </main>
  );
}
