'use client';

import { useParams } from 'next/navigation';
import { DepositDisputeThread } from '@/components/shared/disputes/DepositDisputeThread';
import { ROUTES } from '@/lib/constants/auth';

/** The seller's side of a deposit dispute. Sellers have no purchase workspace, so the sale links back to their sales. */
export default function OwnerDepositDisputePage() {
  const params = useParams<{ disputeId: string }>();
  return (
    <DepositDisputeThread
      disputeId={params?.disputeId ?? ''}
      back={{ label: 'Sales in progress', href: ROUTES.OWNER_TRANSACTIONS }}
    />
  );
}
