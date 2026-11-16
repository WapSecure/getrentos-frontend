import type { LandAvailability } from '@/hooks/useLandAvailability';
import { PUBLIC_REVALIDATE } from '@/lib/publicFetch';

export async function landAvailability(): Promise<LandAvailability | null> {
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
