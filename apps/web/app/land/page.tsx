import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LandMarketplaceBrowser } from '@/components/land/LandMarketplaceBrowser';

export default function LandMarketplacePage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <LandMarketplaceBrowser mode="public" />
      <Footer />
    </main>
  );
}
