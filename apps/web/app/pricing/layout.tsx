import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';

export const metadata: Metadata = {
  title: 'Pricing: Free and Pro plans',
  description:
    'What Sureground costs for landlords, estate managers, property owners and realtors: what the Free plan includes and what Pro adds.',
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
