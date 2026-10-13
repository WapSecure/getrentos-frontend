'use client';

import { useParams } from 'next/navigation';
import { PurchaseDetailView } from '@/components/land/buyer/PurchaseDetailView';

export default function BuyerLandPurchasePage() {
  const params = useParams<{ id: string }>();
  return <PurchaseDetailView purchaseId={params?.id ?? ''} />;
}
