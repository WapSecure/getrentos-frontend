import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';

export const metadata: Metadata = {
  title: 'Pricing: Free, Pro and Enterprise plans',
  description:
    'What Sureground costs for landlords, estate managers, property owners, realtors and agencies: what Free includes, what Pro adds, and Enterprise for whole organisations.',
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
