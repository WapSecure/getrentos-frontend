'use client';

import { Suspense } from 'react';
import { BuyerLandHub } from '@/components/land/buyer/BuyerLandHub';

export default function BuyerLandPurchasesPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-secondary" />}>
      <BuyerLandHub />
    </Suspense>
  );
}
