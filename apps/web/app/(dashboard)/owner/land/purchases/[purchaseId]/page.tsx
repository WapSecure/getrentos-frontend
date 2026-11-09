'use client';

import { useParams } from 'next/navigation';
import { PurchaseDetailView } from '@/components/land/sales/PurchaseDetailView';

export default function OwnerLandPurchasePage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  return <PurchaseDetailView purchaseId={purchaseId} />;
}
