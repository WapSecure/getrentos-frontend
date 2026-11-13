'use client';

import { useParams } from 'next/navigation';
import { DepositDisputeThread } from '@/components/shared/disputes/DepositDisputeThread';
import { ROUTES } from '@/lib/constants/auth';
import { PURCHASE_ROUTES } from '@/lib/constants/purchaseRoutes';

export default function BuyerDepositDisputePage() {
  const params = useParams<{ disputeId: string }>();
  return (
    <DepositDisputeThread
      disputeId={params?.disputeId ?? ''}
      back={{ label: 'Transactions', href: ROUTES.BUYER_TRANSACTIONS }}
      workspaceHref={PURCHASE_ROUTES.buyerWorkspace}
    />
  );
}
