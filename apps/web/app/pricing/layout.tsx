import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Free and Pro plans for landlords, estate managers, property owners and realtors on Sureground.',
  alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
