import { Skeleton } from '@getrentos/ui';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { LayoutDetailView } from '@/components/land/buyer/LayoutDetailView';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Estate plots and payment plans',
    description: 'Plots, fees and payment plans for an estate on a verified master parcel.',
    alternates: { canonical: LAND_BUYER_ROUTES.layout(id) },
  };
}

export default async function LandLayoutPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* useSearchParams (the ?plot= deep link) needs a Suspense boundary. */}
        <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
          <LayoutDetailView layoutId={id} />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
