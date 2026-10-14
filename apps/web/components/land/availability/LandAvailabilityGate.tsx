'use client';

import type { ReactNode } from 'react';
import { MapPinned } from 'lucide-react';
import { useLandAvailability } from '@/hooks/useLandAvailability';

/**
 * Shows land pages only when their audience is open: `marketplace` for public
 * and buyer pages, `owners` for owner setup and the outside reviewer's desk.
 * Otherwise a plain "not available yet" note instead of a page of API errors.
 */
export const LandAvailabilityGate = ({
  audience,
  children,
  shell,
}: {
  audience: 'marketplace' | 'owners';
  children: ReactNode;
  /** Wraps the notice on pages that bring their own navigation (public pages). */
  shell?: (notice: ReactNode) => ReactNode;
}) => {
  const availability = useLandAvailability();
  // Nothing until the answer is in: rendering the page first would fire its
  // land requests (404s while closed) and flash content that then disappears.
  if (availability.isLoading) return null;
  if (availability[audience]) return <>{children}</>;
  const notice = (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <MapPinned className="h-10 w-10 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold text-foreground">Land is not available yet</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {availability.mode === 'onboarding' && audience === 'marketplace'
          ? 'We are verifying parcels and estates before the land marketplace opens. Please check back soon.'
          : 'This part of GetRentos is not open in your area yet. Please check back soon.'}
      </p>
    </div>
  );
  return <>{shell ? shell(notice) : notice}</>;
};
