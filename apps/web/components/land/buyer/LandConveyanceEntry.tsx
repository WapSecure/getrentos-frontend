'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ScrollText } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService } from '@/services/landBuyerService';

/**
 * The way into a land resale's conveyance steps from a transaction. The
 * transaction itself does not say whether the property is land, so this asks
 * the conveyance endpoint, which answers an empty list for anything else, and
 * renders nothing in that case (or on any error).
 */
export const LandConveyanceEntry = ({ txId }: { txId: string }) => {
  const { data } = useQuery({
    queryKey: buyerLandKeys.transactionMilestones(txId),
    queryFn: () => unwrap(landBuyerService.listTransactionMilestones(txId)),
    retry: false,
  });
  if (!data || data.length === 0) return null;

  const outstanding = data.filter(
    (m) => m.required && m.status !== 'CONFIRMED' && m.status !== 'WAIVED'
  ).length;
  const awaiting = data.filter((m) => m.status === 'DELIVERED').length;

  return (
    <Link
      href={LAND_BUYER_ROUTES.transactionConveyance(txId)}
      className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ScrollText className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">Land conveyance</span>
        <span className="block text-xs text-muted-foreground">
          {outstanding === 0
            ? 'All required steps confirmed.'
            : `Escrow releases only after the deed and possession are confirmed. ${outstanding} required step${outstanding === 1 ? '' : 's'} left${awaiting ? `, ${awaiting} awaiting you` : ''}.`}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
};
