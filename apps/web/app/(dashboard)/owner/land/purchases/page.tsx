'use client';

import { Skeleton } from '@sureground/ui';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SalesDesk } from '@/components/land/sales/SalesDesk';

const ScopedSalesDesk = () => {
  const property = useSearchParams().get('property') ?? undefined;
  return <SalesDesk key={property ?? 'all'} initialPropertyId={property} />;
};

export default function OwnerLandPurchasesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <ScopedSalesDesk />
    </Suspense>
  );
}
