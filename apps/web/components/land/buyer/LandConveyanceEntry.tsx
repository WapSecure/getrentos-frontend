'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ScrollText } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService } from '@/services/landBuyerService';
import type { BuyerEscrowTransaction } from '@/types/buyer';

interface LandConveyanceEntryProps {
  transaction: Pick<BuyerEscrowTransaction, 'id' | 'propertyType'>;
}

/**
 * The way into a land resale's conveyance steps from a transaction. Only land
 * sales have them, and the transaction says what it sold, so nothing is asked
 * of the API for any other property.
 */
export const LandConveyanceEntry = ({ transaction }: LandConveyanceEntryProps) => {
  const txId = transaction.id;
  const isLand = transaction.propertyType === 'LAND';
  const { data } = useQuery({
    queryKey: buyerLandKeys.transactionMilestones(txId),
    queryFn: () => unwrap(landBuyerService.listTransactionMilestones(txId)),
    enabled: isLand,
  });
  if (!isLand) return null;

  const milestones = data ?? [];
  const outstanding = milestones.filter(
    (m) => m.required && m.status !== 'CONFIRMED' && m.status !== 'WAIVED'
  ).length;
  const awaiting = milestones.filter((m) => m.status === 'DELIVERED').length;

  return (
    <Link
      href={LAND_BUYER_ROUTES.transactionConveyance(txId)}
      className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ScrollText className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">Land conveyance</span>
        <span className="block text-xs text-muted-foreground">
          {!data
            ? 'GetRentos releases your payment only after the deed and possession are confirmed.'
            : outstanding === 0
              ? 'All required steps confirmed.'
              : `GetRentos releases your payment only after the deed and possession are confirmed. ${outstanding} required step${outstanding === 1 ? '' : 's'} left${awaiting ? `, ${awaiting} awaiting you` : ''}.`}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
};
