'use client';

import { Skeleton } from '@getrentos/ui';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SalesDesk } from '@/components/land/sales/SalesDesk';

const ScopedSalesDesk = () => {
  const property = useSearchParams().get('property') ?? undefined;
  return <SalesDesk key={property ?? 'all'} initialPropertyId={property} />;
};

/** The plot sales desk across the owner's estates (`?property=` scopes it to one). */
export default function OwnerLandPurchasesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <ScopedSalesDesk />
    </Suspense>
  );
}
