import type { ReactNode } from 'react';
import { LandLayoutShell } from '@/components/land/availability/LandLayoutShell';
import { landAvailability } from '@/lib/landAvailability';

// Server layout: crawlers and first paint get the land pages, not an empty gate waiting on the browser.
export default async function LandLayout({ children }: { children: ReactNode }) {
  return <LandLayoutShell initial={await landAvailability()}>{children}</LandLayoutShell>;
}
