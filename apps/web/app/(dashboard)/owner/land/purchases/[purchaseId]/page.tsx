'use client';

import { useParams } from 'next/navigation';
import { PurchaseDetailView } from '@/components/land/sales/PurchaseDetailView';

/** One plot purchase: schedule, payments, conveyance, documents and revocation. */
export default function OwnerLandPurchasePage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  return <PurchaseDetailView purchaseId={purchaseId} />;
}
