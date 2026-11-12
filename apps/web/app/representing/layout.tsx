import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ReviewerAuthGate } from '@/components/land/reviews/ReviewerAuthGate';

export const metadata: Metadata = {
  title: 'Representing buyers',
  robots: { index: false, follow: false },
};

// Any signed-in account: an accepted appointment, not a role, grants access.
export default function RepresentingLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ReviewerAuthGate>{children}</ReviewerAuthGate>
      </div>
    </main>
  );
}
