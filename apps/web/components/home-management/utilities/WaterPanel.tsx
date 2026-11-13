'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, ClipboardCheck, Plus } from '@sureground/icons';
import {
  WATER_TEST_RESULT_LABELS,
  formatCurrency,
  type UtilityPurchaseKind,
  type WaterQualityTest,
  type WaterTestResult,
} from '@sureground/shared';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  IconButton,
  Pagination,
  ReasonDialog,
  useToast,
  type BadgeVariant,
  type Column,
} from '@sureground/ui';
import { HomeManagementSectionHeading } from '@/components/home-management/HomeManagementSectionHeading';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import type { HomeManagementProperty } from '@/services/homeManagementService';
import { utilitiesService } from '@/services/utilitiesService';
import { UtilityPurchaseDialog } from './UtilityPurchaseDialog';
import { UtilityPurchaseList } from './UtilityPurchaseList';
import { WaterTestDialog } from './WaterTestDialog';

const PAGE_SIZE = 10;

const RESULT_BADGE: Record<WaterTestResult, BadgeVariant> = {
  PASS: 'success',
  FAIL: 'danger',
  INCONCLUSIVE: 'warning',
};

interface WaterPanelProps {
  propertyId?: string;
  properties: HomeManagementProperty[];
  recordOnly?: boolean;
  openPurchase: { kinds: UtilityPurchaseKind[] } | null;
  onOpenPurchaseChange: (value: { kinds: UtilityPurchaseKind[] } | null) => void;
  waterTestOpen: boolean;
  onWaterTestChange: (open: boolean) => void;
  onRaiseWorkOrder?: () => void;
}

export function WaterPanel({
  propertyId,
  properties,
  recordOnly = false,
  openPurchase,
  onOpenPurchaseChange,
  waterTestOpen,
  onWaterTestChange,
  onRaiseWorkOrder,
}: WaterPanelProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [voiding, setVoiding] = useState<WaterQualityTest | null>(null);
  const tests = useQuery({
    queryKey: homeManagementKeys.utilities.waterTests(propertyId, page),
    queryFn: () =>
      unwrap(utilitiesService.listWaterTests({ propertyId, page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const voidTest = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(utilitiesService.voidWaterTest(id, reason)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      toast.success('Test voided. It stays on the record with your reason.');
    },
  });
  const latestFail = (tests.data?.items ?? []).find((test) => !test.voidedAt)?.result === 'FAIL';

  const columns: Column<WaterQualityTest>[] = [
    {
      key: 'sampled',
      header: 'Sampled',
      render: (row) => (
        <span className={row.voidedAt ? 'text-muted-foreground line-through' : ''}>
          {formatDate(row.sampledAt)}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{row.asset?.name ?? 'Not recorded'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.property.title} · {row.labName}
          </p>
          {row.voidedAt && (
            <p className="text-xs text-muted-foreground">Voided: {row.voidReason}</p>
          )}
        </div>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      render: (row) => (
        <div className="space-y-1">
          <Badge variant={row.voidedAt ? 'neutral' : RESULT_BADGE[row.result]}>
            {WATER_TEST_RESULT_LABELS[row.result]}
          </Badge>
          {row.parameters && (
            <p className="text-xs text-muted-foreground">
              {Object.entries(row.parameters)
                .map(([key, value]) => `${key} ${value}`)
                .join(', ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'shared',
      header: 'Residents',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.sharedWithResidents ? 'Shared' : 'Not shared'}
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Lab fee',
      numeric: true,
      render: (row) =>
        row.cost ? (
          formatCurrency(row.cost)
        ) : (
          <span className="text-muted-foreground">Not recorded</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      render: (row) =>
        !row.voidedAt && !recordOnly ? (
          <IconButton
            size="sm"
            variant="ghost"
            label="Void this water test"
            icon={<Ban />}
            onClick={() => setVoiding(row)}
          />
        ) : null,
    },
  ];

  return (
    <div className="space-y-10">
      <section aria-labelledby="water-tests-heading" className="space-y-4">
        <HomeManagementSectionHeading
          id="water-tests-heading"
          title="Water quality tests"
          description="Lab results for boreholes, tanks and treatment. Residents see a result only if you share it."
          actions={
            <Button
              rounded="md"
              icon={<Plus className="h-4 w-4" />}
              disabled={properties.length === 0}
              onClick={() => onWaterTestChange(true)}
            >
              Record water test
            </Button>
          }
        />
        {latestFail && onRaiseWorkOrder && (
          <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              The latest test failed. Raise a work order to treat the water, then book a retest.
            </p>
            <Button size="sm" rounded="md" onClick={onRaiseWorkOrder}>
              Create work order
            </Button>
          </div>
        )}
        <DataTable
          caption="Water quality tests"
          columns={columns}
          data={tests.data?.items ?? []}
          getRowKey={(row) => row.id}
          isLoading={tests.isLoading}
          minWidth="720px"
          emptyState={
            <EmptyState
              icon={ClipboardCheck}
              size="compact"
              bare
              title={tests.isError ? 'Tests could not be loaded' : 'No water tests yet'}
              description={
                tests.isError
                  ? 'Refresh the page to try again.'
                  : 'Record each lab test of the borehole or tank water, with the lab report.'
              }
            />
          }
        />
        {(tests.data?.total ?? 0) > PAGE_SIZE && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={tests.data?.total ?? 0}
            onPageChange={setPage}
          />
        )}
      </section>

      <section aria-labelledby="tanker-heading" className="space-y-4">
        <HomeManagementSectionHeading
          id="tanker-heading"
          title="Tanker deliveries"
          description="Water bought by the tanker load."
          actions={
            <Button
              variant="outline"
              rounded="md"
              disabled={properties.length === 0}
              onClick={() => onOpenPurchaseChange({ kinds: ['WATER_TANKER'] })}
            >
              Record delivery
            </Button>
          }
        />
        <UtilityPurchaseList
          propertyId={propertyId}
          kinds={['WATER_TANKER']}
          caption="Water tanker deliveries"
          emptyTitle="No deliveries recorded"
          emptyDescription="Record each tanker load with the litres and the receipt."
        />
      </section>

      <WaterTestDialog
        open={waterTestOpen}
        onOpenChange={onWaterTestChange}
        properties={properties}
        defaultPropertyId={propertyId}
      />
      <UtilityPurchaseDialog
        open={!!openPurchase}
        onOpenChange={(open) => !open && onOpenPurchaseChange(null)}
        properties={properties}
        defaultPropertyId={propertyId}
        kinds={openPurchase?.kinds ?? ['WATER_TANKER']}
      />
      <ReasonDialog
        open={!!voiding}
        onOpenChange={(open) => !open && setVoiding(null)}
        title="Void this water test"
        description="Voided tests stay on the record, struck through, with your reason."
        reasonLabel="Why is it being voided?"
        minLength={3}
        maxLength={500}
        confirmLabel="Void test"
        tone="danger"
        error={voidTest.error?.message}
        onSubmit={({ reason }) =>
          voidTest.mutateAsync({ id: voiding!.id, reason }).then(() => setVoiding(null))
        }
      />
    </div>
  );
}
