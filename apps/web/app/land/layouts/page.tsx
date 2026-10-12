import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LayoutsBrowser } from '@/components/land/buyer/LayoutsBrowser';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';

export const metadata: Metadata = {
  title: 'Estates: Buy a Plot on a Verified Layout',
  description:
    'Browse estates selling plots on verified master parcels. See every plot, its price, the fees and the payment plans before you reserve.',
  alternates: { canonical: LAND_BUYER_ROUTES.LAYOUTS },
};

export default function LandLayoutsPage() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl">
            Buy a plot in a verified estate.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Every estate here sits on a master parcel whose ownership and diligence we have
            verified. Reserve a plot free for a few hours, pay on a plan, and your money is held in
            escrow until each conveyance step is delivered.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/land" className="font-medium text-primary hover:underline">
              Looking for a single parcel? Browse land listings
            </Link>
            <span className="mx-2 text-muted-foreground">·</span>
            <Link
              href={LAND_BUYER_ROUTES.MARKET_INSIGHTS}
              className="font-medium text-primary hover:underline"
            >
              Land prices by area
            </Link>
          </p>
        </div>
        <LayoutsBrowser />
      </div>
      <Footer />
    </main>
  );
}
