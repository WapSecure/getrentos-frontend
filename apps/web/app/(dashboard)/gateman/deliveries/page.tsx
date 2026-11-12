'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Plus } from '@sureground/icons';
import { NotAssignedToEstate } from '@/components/gateman/NotAssignedToEstate';
import { Button, CardSkeleton, ListSkeleton } from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { LogDeliveryModal } from '@/components/estate/deliveries/LogDeliveryModal';
import { DeliveryLogRow } from '@/components/estate/deliveries/DeliveryLogRow';
import { CollectDeliveryDialog } from '@/components/estate/deliveries/CollectDeliveryDialog';
import type { DeliveryLog } from '@/types/estate';

const HOUSEHOLD_OPTIONS_PAGE_SIZE = 20;
const RECENTLY_COLLECTED = 10;

export default function GatemanDeliveriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [householdPage, setHouseholdPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useGatemanPost();

  const { data: gates } = useQuery({
    queryKey: estateKeys.gates(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listGates(estate!.id)),
    enabled: !!estate,
  });

  const { data: householdsData, isLoading: isHouseholdsLoading } = useQuery({
    queryKey: [
      ...estateKeys.households(estate?.id ?? ''),
      {
        page: householdPage,
        pageSize: HOUSEHOLD_OPTIONS_PAGE_SIZE,
        status: 'active',
        purpose: 'delivery-options',
      },
    ],
    queryFn: () =>
      unwrap(
        estateService.listHouseholds(estate!.id, {
          page: householdPage,
          pageSize: HOUSEHOLD_OPTIONS_PAGE_SIZE,
          status: 'active',
        })
      ),
    enabled: !!estate,
    placeholderData: keepPreviousData,
  });
  const households = householdsData?.items ?? [];
  const householdsTotal = householdsData?.total ?? 0;

  const { data: awaitingData, isLoading: isAwaitingLoading } = useQuery({
    queryKey: estateKeys.deliveries(estate?.id ?? '', 'received'),
    queryFn: () =>
      unwrap(
        estateService.listDeliveries(estate!.id, { status: 'received', page: 1, pageSize: 100 })
      ),
    enabled: !!estate,
  });
  const awaiting = awaitingData?.items ?? [];

  const { data: collectedData } = useQuery({
    queryKey: [
      ...estateKeys.deliveries(estate?.id ?? '', 'collected'),
      { pageSize: RECENTLY_COLLECTED },
    ],
    queryFn: () =>
      unwrap(
        estateService.listDeliveries(estate!.id, {
          status: 'collected',
          page: 1,
          pageSize: RECENTLY_COLLECTED,
        })
      ),
    enabled: !!estate,
  });
  const recentlyCollected = collectedData?.items ?? [];

  const invalidateLogs = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'deliveries'] });
  };

  const logDelivery = useMutation({
    mutationFn: (data: Parameters<typeof estateService.logDelivery>[1]) =>
      unwrap(estateService.logDelivery(estate!.id, data)),
    onSuccess: () => {
      invalidateLogs();
      setIsModalOpen(false);
    },
  });

  const [collectTarget, setCollectTarget] = useState<DeliveryLog | null>(null);

  const markCollected = useMutation({
    meta: { showGlobalError: true },
    mutationFn: ({ logId, collectedBy }: { logId: string; collectedBy?: string }) =>
      unwrap(estateService.markDeliveryCollected(estate!.id, logId, collectedBy)),
    onSuccess: () => {
      invalidateLogs();
      setCollectTarget(null);
    },
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) {
    return <NotAssignedToEstate icon={Package} />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <Package className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{estate.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Log a delivery for a household.</p>
      </div>

      <Button
        variant="primary"
        fullWidth
        className="gap-2"
        onClick={() => {
          setHouseholdPage(1);
          setIsModalOpen(true);
        }}
      >
        <Plus className="w-4 h-4" />
        Log delivery
      </Button>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Awaiting Pickup ({awaiting.length})
        </h2>
        {isAwaitingLoading ? (
          <ListSkeleton rows={2} />
        ) : awaiting.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deliveries awaiting pickup.</p>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {awaiting.map((log) => (
              <DeliveryLogRow
                key={log.id}
                log={log}
                onMarkCollected={() => setCollectTarget(log)}
                isMarkingCollected={markCollected.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {recentlyCollected.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Recently collected</h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {recentlyCollected.map((log) => (
              <DeliveryLogRow key={log.id} log={log} />
            ))}
          </div>
        </div>
      )}

      <LogDeliveryModal
        isOpen={isModalOpen}
        estateId={estate.id}
        households={households}
        householdTotal={householdsTotal}
        householdPage={householdPage}
        householdPageSize={HOUSEHOLD_OPTIONS_PAGE_SIZE}
        onHouseholdPageChange={setHouseholdPage}
        isHouseholdsLoading={isHouseholdsLoading}
        gates={gates}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => logDelivery.mutate(data)}
        isSubmitting={logDelivery.isPending}
      />

      <CollectDeliveryDialog
        log={collectTarget}
        onClose={() => setCollectTarget(null)}
        onConfirm={(collectedBy) =>
          collectTarget && markCollected.mutate({ logId: collectTarget.id, collectedBy })
        }
        isSubmitting={markCollected.isPending}
      />
    </div>
  );
}
