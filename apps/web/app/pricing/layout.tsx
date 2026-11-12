import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';

export const metadata: Metadata = {
  title: 'Pricing: Free and Pro plans for landlords, owners and realtors',
  description:
    'Free and Pro plans for landlords, estate managers, property owners and realtors on Sureground.',
  alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        {children}
      </main>
      <Footer />
    </>
  );
}
