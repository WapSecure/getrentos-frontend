'use client';

import { useParams } from 'next/navigation';
import { ResaleConveyanceView } from '@/components/land/buyer/ResaleConveyanceView';

export default function BuyerLandConveyancePage() {
  const params = useParams<{ txId: string }>();
  return <ResaleConveyanceView txId={params?.txId ?? ''} />;
}
