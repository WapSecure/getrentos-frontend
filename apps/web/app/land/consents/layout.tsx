import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ReviewerAuthGate } from '@/components/land/reviews/ReviewerAuthGate';

export const metadata: Metadata = {
  title: 'Land sale consents',
  robots: { index: false, follow: false },
};

/**
 * Where a co-owner, family member or principal answers a seller's request for
 * consent. Any signed-in account: being listed by a seller is what grants it.
 */
export default function LandConsentsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <ReviewerAuthGate>{children}</ReviewerAuthGate>
      </div>
    </main>
  );
}
