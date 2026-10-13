'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ResaleConveyanceView } from '@/components/land/sales/ResaleConveyanceView';

/** Conveyance steps on the sale of a whole land parcel. */
export default function OwnerLandTransactionPage() {
  const { txId } = useParams<{ txId: string }>();
  // The view reads `?property=` to offer the land's documents as evidence.
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-secondary" />}>
      <ResaleConveyanceView txId={txId} />
    </Suspense>
  );
}
