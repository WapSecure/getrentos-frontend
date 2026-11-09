'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Breadcrumbs, Card, PageErrorState, PageHeader, Skeleton } from '@sureground/ui';
import { Info } from 'lucide-react';
import { ROUTES } from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { LandMilestone, LandMilestoneDeliverInput } from '@/types/landDeveloper';
import { errorMessage, useNotify } from '../developer/feedback';
import { DeliverMilestoneDialog } from './DeliverMilestoneDialog';
import { MilestoneList } from './MilestoneList';
import { ConditionsPanel } from '../closing/ConditionsPanel';

// The buyer's money stays in escrow until they confirm every required step.
export const ResaleConveyanceView = ({ txId }: { txId: string }) => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();
  const [delivering, setDelivering] = useState<LandMilestone | null>(null);
  const key = landDeveloperKeys.transactionMilestones(txId);
  const propertyHint = useSearchParams().get('property');
  // The sale says which land it is; the link's hint only bridges the first load.
  const resale = useQuery({
    queryKey: [...key, 'sale'],
    queryFn: () => unwrap(landDeveloperService.getResale(txId)),
  });
  const propertyId = resale.data?.propertyId ?? propertyHint;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
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
      // By key: planned steps have `planned:<KEY>` ids until the first action creates the rows, so the list reloads for the real ids.
      queryClient.setQueryData<LandMilestone[]>(key, (current) =>
        current?.map((milestone) => (milestone.key === updated.key ? updated : milestone))
      );
      queryClient.invalidateQueries({ queryKey: key });
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: landDeveloperKeys.documents(propertyId) });
      }
      setDelivering(null);
      notify(`${updated.label}: marked delivered. The buyer has been asked to confirm.`);
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const conditionsKey = landDeveloperKeys.transactionConditions(txId);
  const conditions = useQuery({
    queryKey: conditionsKey,
    queryFn: () => unwrap(landDeveloperService.listTransactionConditions(txId)),
  });
  const deliverCondition = useMutation({
    mutationFn: ({ conditionKey, note }: { conditionKey: string; note: string }) =>
      unwrap(landDeveloperService.deliverTransactionCondition(txId, conditionKey, note)),
    onSuccess: (next) => {
      queryClient.setQueryData(conditionsKey, next);
      notify('Marked met. The buyer has been asked to confirm.');
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const required = data?.filter((milestone) => milestone.required) ?? [];
  const satisfied = required.filter(
    (milestone) => milestone.status === 'CONFIRMED' || milestone.status === 'WAIVED'
  );

  return (
    <>
      <Breadcrumbs
        className="mb-0"
        items={[
          { label: 'Sales in progress', href: ROUTES.OWNER_TRANSACTIONS },
          { label: 'Land conveyance' },
        ]}
      />
      <PageHeader
        className="mt-2"
        title="Land conveyance"
        description="Mark each step delivered as you complete it. The buyer confirms each one, and the payment is released to you once every required step is confirmed."
      />

      {conditions.data && conditions.data.length > 0 && (
        <Card static className="mt-6 p-5">
          <h2 className="font-semibold text-foreground">Conditions of the sale</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            The payment is not released while any condition is open. Mark the ones you deliver as
            met; Sureground checked the rest against the record. A condition missed by its deadline
            lets the buyer cancel with a full refund.
          </p>
          <ConditionsPanel
            conditions={conditions.data}
            role="developer"
            sellerLabel="You"
            busyKey={
              deliverCondition.isPending ? (deliverCondition.variables?.conditionKey ?? null) : null
            }
            onDeliver={(conditionKey, note) => deliverCondition.mutate({ conditionKey, note })}
          />
        </Card>
      )}

      <div className="mt-6">
        {isLoading ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : !data ? (
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
        propertyId={propertyId}
        onOpenChange={(open) => !open && setDelivering(null)}
        isSaving={deliver.isPending}
        onDeliver={(milestone, input) => deliver.mutate({ milestone, input })}
      />
    </>
  );
};
