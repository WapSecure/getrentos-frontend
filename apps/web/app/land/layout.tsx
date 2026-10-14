'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LandAvailabilityGate } from '@/components/land/availability/LandAvailabilityGate';

/** Public land pages follow the marketplace; the reviewer's desk follows owner onboarding. */
export default function LandLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const audience = pathname?.startsWith('/land/reviews') ? 'owners' : 'marketplace';
  return (
    <LandAvailabilityGate
      audience={audience}
      // The pages bring their own navigation; keep it around the notice.
      shell={(notice) => (
        <>
          <Navigation />
          <main className="min-h-[60vh] pt-20">{notice}</main>
          <Footer />
        </>
      )}
    >
      {children}
    </LandAvailabilityGate>
  );
}
