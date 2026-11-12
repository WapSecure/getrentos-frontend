import type { ReactNode } from 'react';
import { LandLayoutShell } from '@/components/land/availability/LandLayoutShell';
import type { LandAvailability } from '@/hooks/useLandAvailability';
import { PUBLIC_REVALIDATE } from '@/lib/publicFetch';

async function landAvailability(): Promise<LandAvailability | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/land/availability`, {
      next: { revalidate: PUBLIC_REVALIDATE },
    });
    return res.ok ? ((await res.json()) as LandAvailability) : null;
  } catch {
    return null;
  }
}

// Server layout: crawlers and first paint get the land pages, not an empty gate waiting on the browser.
export default async function LandLayout({ children }: { children: ReactNode }) {
  return <LandLayoutShell initial={await landAvailability()}>{children}</LandLayoutShell>;
}
