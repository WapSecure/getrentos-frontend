'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@getrentos/ui';
import { ArrowRight, MapPinned } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { LAND_DEVELOPER_ROUTES } from '@/lib/constants/landDeveloperRoutes';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { EscrowSaleTransaction } from '@/types/owner';

interface LandConveyanceEntryProps {
  transaction: Pick<EscrowSaleTransaction, 'id' | 'propertyId' | 'propertyType'>;
}

/**
 * A link to the conveyance steps of a land sale, for the owner's transaction
 * detail. Only land sales have them: the transaction says what it sold, so
 * nothing is asked of the API for any other property. Reading the steps writes
 * nothing; before anyone acts they are the planned steps of the sale.
 */
export const LandConveyanceEntry = ({ transaction }: LandConveyanceEntryProps) => {
  const isLand = transaction.propertyType === 'LAND';
  const { data, isError } = useQuery({
    queryKey: landDeveloperKeys.transactionMilestones(transaction.id),
    queryFn: () => unwrap(landDeveloperService.listTransactionMilestones(transaction.id)),
    enabled: isLand,
    staleTime: 60_000,
  });

  if (!isLand) return null;

  const milestones = data ?? [];
  const required = milestones.filter((milestone) => milestone.required);
  const confirmed = required.filter(
    (milestone) => milestone.status === 'CONFIRMED' || milestone.status === 'WAIVED'
  ).length;
  const awaitingYou = milestones.filter(
    (milestone) => milestone.status === 'PENDING' || milestone.status === 'DISPUTED'
  ).length;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">Land conveyance</p>
          <p className="text-xs text-muted-foreground">
            {!data
              ? isError
                ? 'Deed, survey and possession steps the buyer confirms before payout.'
                : 'Loading the conveyance steps…'
              : `${confirmed} of ${required.length} required steps confirmed${
                  awaitingYou > 0 ? ` · ${awaitingYou} for you to deliver` : ''
                }`}
          </p>
        </div>
      </div>
      <Button
        href={LAND_DEVELOPER_ROUTES.transactionMilestones(transaction.id, transaction.propertyId)}
        variant="outline"
        size="sm"
        rounded="lg"
        iconPosition="right"
        icon={<ArrowRight className="h-4 w-4" />}
      >
        Manage steps
      </Button>
    </div>
  );
};
