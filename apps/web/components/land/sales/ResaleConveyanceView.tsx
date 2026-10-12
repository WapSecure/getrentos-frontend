'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, PageErrorState } from '@getrentos/ui';
import { ArrowLeft, Info } from 'lucide-react';
import { ROUTES } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { LandMilestone, LandMilestoneDeliverInput } from '@/types/landDeveloper';
import { errorMessage, useNotify } from '../developer/feedback';
import { DeliverMilestoneDialog } from './DeliverMilestoneDialog';
import { MilestoneList } from './MilestoneList';

/**
 * Conveyance steps on the sale of a whole parcel through a marketplace offer.
 * The buyer's money stays in escrow until they confirm every required step.
 */
export const ResaleConveyanceView = ({ txId }: { txId: string }) => {
  const queryClient = useQueryClient();
  const { notify, toast } = useNotify();
  const [delivering, setDelivering] = useState<LandMilestone | null>(null);
  const key = landDeveloperKeys.transactionMilestones(txId);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: key,
    queryFn: () => unwrap(landDeveloperService.listTransactionMilestones(txId)),
  });

  const deliver = useMutation({
    mutationFn: ({
      milestone,
      input,
    }: {
      milestone: LandMilestone;
      input: LandMilestoneDeliverInput;
    }) => unwrap(landDeveloperService.deliverTransactionMilestone(txId, milestone.key, input)),
    onSuccess: (updated) => {
      queryClient.setQueryData<LandMilestone[]>(key, (current) =>
        current?.map((milestone) => (milestone.id === updated.id ? updated : milestone))
      );
      setDelivering(null);
      notify(`${updated.label}: marked delivered. The buyer has been asked to confirm.`);
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const required = data?.filter((milestone) => milestone.required) ?? [];
  const satisfied = required.filter(
    (milestone) => milestone.status === 'CONFIRMED' || milestone.status === 'WAIVED'
  );

  return (
    <>
      <Link
        href={ROUTES.OWNER_TRANSACTIONS}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Sales in progress
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-foreground">
        Land conveyance
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Mark each step delivered as you complete it. The buyer confirms each one, and the payment is
        released to you once every required step is confirmed.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-80 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
        ) : isError || !data ? (
          <PageErrorState
            title="The conveyance steps could not be loaded"
            description={errorMessage(error)}
            onRetry={() => refetch()}
            isRetrying={isRefetching}
          />
        ) : (
          <Card static className="p-5">
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                {satisfied.length} of {required.length} required steps confirmed by the buyer.
                Governor&apos;s Consent can take months, so it is tracked but does not hold up the
                payment.
              </p>
            </div>
            <MilestoneList
              milestones={data}
              deliverability={() => ({ allowed: true })}
              onDeliver={setDelivering}
            />
          </Card>
        )}
      </div>

      <DeliverMilestoneDialog
        milestone={delivering}
        onOpenChange={(open) => !open && setDelivering(null)}
        isSaving={deliver.isPending}
        onDeliver={(milestone, input) => deliver.mutate({ milestone, input })}
      />
      {toast}
    </>
  );
};
