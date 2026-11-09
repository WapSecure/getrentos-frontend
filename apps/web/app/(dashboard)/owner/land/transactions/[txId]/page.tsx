'use client';

import { Skeleton } from '@sureground/ui';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ResaleConveyanceView } from '@/components/land/sales/ResaleConveyanceView';

export default function OwnerLandTransactionPage() {
  const { txId } = useParams<{ txId: string }>();
  return (
    <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
      <ResaleConveyanceView txId={txId} />
    </Suspense>
  );
}
