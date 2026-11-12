import { PUBLIC_REVALIDATE } from '@/lib/publicFetch';

// Off unless the API says it is on: a failed check hides the service rather than advertising a closed one.
export async function diasporaInvestEnabled(): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/investor/availability`, {
      next: { revalidate: PUBLIC_REVALIDATE },
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { enabled?: unknown } | null;
    return body?.enabled === true;
  } catch {
    return false;
  }
}
