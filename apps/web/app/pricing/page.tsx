import { PricingView } from '@/components/pricing/PricingView';
import { OPTIONAL_FETCH_TIMEOUT_MS, PUBLIC_REVALIDATE } from '@/lib/publicFetch';
import type { PlanPricing } from '@/services/subscriptionService';

// Public route. Without it (API down or slow) the page loads the pricing in the browser, as before.
async function fetchPricing(): Promise<PlanPricing | undefined> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/me/subscription/pricing`, {
      next: { revalidate: PUBLIC_REVALIDATE },
      signal: AbortSignal.timeout(OPTIONAL_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return undefined;
    return (await res.json()) as PlanPricing;
  } catch {
    return undefined;
  }
}

export default async function PricingPage() {
  return <PricingView initialPricing={await fetchPricing()} />;
}
