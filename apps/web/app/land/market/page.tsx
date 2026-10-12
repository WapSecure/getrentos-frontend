import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { MarketInsightsView } from '@/components/land/market/MarketInsightsView';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';

export const metadata: Metadata = {
  title: 'Land Prices: Price per Square Metre by Area',
  description:
    'Asking prices per square metre for verified land in Nigeria, by state, city, estate and title document.',
  alternates: { canonical: LAND_BUYER_ROUTES.MARKET_INSIGHTS },
};

export default function LandMarketInsightsPage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl">
            What land costs, area by area.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Asking prices per square metre across verified land listings. Unverified land is left
            out, so a few inflated listings cannot skew the picture.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/land" className="font-medium text-primary hover:underline">
              Browse verified land
            </Link>
            <span className="mx-2 text-muted-foreground">·</span>
            <Link
              href={LAND_BUYER_ROUTES.LAYOUTS}
              className="font-medium text-primary hover:underline"
            >
              Estates selling plots
            </Link>
          </p>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-secondary" />}>
          <MarketInsightsView />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
