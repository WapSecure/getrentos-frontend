'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@getrentos/ui';
import { ArrowRight, MapPinned } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { LAND_DEVELOPER_ROUTES } from '@/lib/constants/landDeveloperRoutes';
import { landDeveloperService } from '@/services/landDeveloperService';

/**
 * A link to the conveyance steps of a land sale, for the owner's transaction
 * detail. Transactions do not say what kind of property they are for, so this
 * asks for the land milestones and renders nothing when the sale is not land
 * (the API refuses with 400) or the request fails for any other reason.
 */
export const LandConveyanceEntry = ({ transactionId }: { transactionId: string }) => {
  const { data } = useQuery({
    queryKey: landDeveloperKeys.transactionMilestones(transactionId),
    queryFn: () => unwrap(landDeveloperService.listTransactionMilestones(transactionId)),
    retry: false,
    staleTime: 60_000,
  });

  if (!data || data.length === 0) return null;

  const required = data.filter((milestone) => milestone.required);
  const confirmed = required.filter(
    (milestone) => milestone.status === 'CONFIRMED' || milestone.status === 'WAIVED'
  ).length;
  const awaitingYou = data.filter(
    (milestone) => milestone.status === 'PENDING' || milestone.status === 'DISPUTED'
  ).length;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">Land conveyance</p>
          <p className="text-xs text-muted-foreground">
            {confirmed} of {required.length} required steps confirmed
            {awaitingYou > 0 ? ` · ${awaitingYou} for you to deliver` : ''}
          </p>
        </div>
      </div>
      <Button
        href={LAND_DEVELOPER_ROUTES.transactionMilestones(transactionId)}
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
