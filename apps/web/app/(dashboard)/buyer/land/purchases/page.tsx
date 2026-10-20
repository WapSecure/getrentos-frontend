'use client';

import { Skeleton } from '@getrentos/ui';
import { Suspense } from 'react';
import { BuyerLandHub } from '@/components/land/buyer/BuyerLandHub';

export default function BuyerLandPurchasesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
      <BuyerLandHub />
    </Suspense>
  );
}
