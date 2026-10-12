'use client';

import { useParams } from 'next/navigation';
import { ResaleConveyanceView } from '@/components/land/sales/ResaleConveyanceView';

/** Conveyance steps on the sale of a whole land parcel. */
export default function OwnerLandTransactionPage() {
  const { txId } = useParams<{ txId: string }>();
  return <ResaleConveyanceView txId={txId} />;
}
