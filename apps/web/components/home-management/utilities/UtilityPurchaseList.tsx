'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Paperclip, ReceiptText } from '@sureground/icons';
import {
  FUEL_TYPE_LABELS,
  PAID_BY_LABELS,
  PURCHASE_KIND_LABELS,
  formatCurrency,
  formatKwh,
  formatLitres,
  maskMeterNumber,
  pricePerUnit,
  type UtilityPurchase,
  type UtilityPurchaseKind,
} from '@sureground/shared';
import {
  Badge,
  DataTable,
  EmptyState,
  IconButton,
  Pagination,
  ReasonDialog,
  useToast,
  type Column,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import { utilitiesService } from '@/services/utilitiesService';

const PAGE_SIZE = 10;

interface UtilityPurchaseListProps {
  propertyId?: string;
  kinds: UtilityPurchaseKind[];
  emptyTitle: string;
  emptyDescription: string;
  caption: string;
}

function quantityText(purchase: UtilityPurchase): string {
  if (purchase.quantity === null) return '';
  return purchase.kind === 'ELECTRICITY_TOKEN'
    ? formatKwh(purchase.quantity)
    : formatLitres(purchase.quantity);
}

function detailText(purchase: UtilityPurchase): string {
  switch (purchase.kind) {
    case 'FUEL':
      return [
        purchase.fuelType ? FUEL_TYPE_LABELS[purchase.fuelType] : null,
        purchase.generator?.name,
      ]
        .filter(Boolean)
        .join(', ');
    case 'ELECTRICITY_TOKEN':
    case 'ELECTRICITY_BILL':
      return [
        purchase.meter?.label || purchase.unit?.name,
        purchase.meter ? maskMeterNumber(purchase.meter.meterNumberLast4) : null,
        purchase.tokenLast4 ? `token ending ${purchase.tokenLast4}` : null,
      ]
        .filter(Boolean)
        .join(', ');
    case 'WATER_TANKER':
      return purchase.tank?.name ?? '';
    default:
      return '';
  }
}

/** A ledger of purchases. Corrections are voids with a reason, never deletions; voided rows stay visible. */
export function UtilityPurchaseList({
  propertyId,
  kinds,
  emptyTitle,
  emptyDescription,
  caption,
}: UtilityPurchaseListProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [voiding, setVoiding] = useState<UtilityPurchase | null>(null);
  const kind = kinds.length === 1 ? kinds[0] : undefined;
  const params = { propertyId, kind, page, pageSize: PAGE_SIZE, includeVoided: true };
  const query = useQuery({
    queryKey: homeManagementKeys.utilities.purchases({ ...params, kinds: kinds.join(',') }),
    queryFn: () => unwrap(utilitiesService.listPurchases(params)),
    placeholderData: keepPreviousData,
  });
  const rows = (query.data?.items ?? []).filter((row) => kinds.includes(row.kind));

  const voidPurchase = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(utilitiesService.voidPurchase(id, reason)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      toast.success('Entry voided. It stays on the record, struck through.');
    },
  });

  const columns: Column<UtilityPurchase>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <span className={row.voidedAt ? 'text-muted-foreground line-through' : ''}>
          {formatDate(row.occurredAt)}
        </span>
      ),
    },
    {
      key: 'what',
      header: 'What',
      render: (row) => (
        <div className="min-w-0">
          <p
            className={
              row.voidedAt ? 'text-muted-foreground line-through' : 'font-medium text-foreground'
            }
          >
            {kinds.length > 1 ? `${PURCHASE_KIND_LABELS[row.kind]} ` : ''}
            {quantityText(row)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[detailText(row), row.property.title].filter(Boolean).join(' · ')}
          </p>
          {row.voidedAt && (
            <p className="text-xs text-muted-foreground">Voided: {row.voidReason}</p>
          )}
        </div>
      ),
    },
    {
      key: 'paid',
      header: 'Paid by',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {PAID_BY_LABELS[row.paidBy]}
          {row.purchasedByName ? ` (${row.purchasedByName})` : ''}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      numeric: true,
      render: (row) => {
        const perUnit = pricePerUnit(row.amount, row.quantity);
        return (
          <div className={row.voidedAt ? 'text-muted-foreground line-through' : ''}>
            <p className="font-medium">{formatCurrency(row.amount)}</p>
            {perUnit !== null && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(perUnit)} per {row.kind === 'ELECTRICITY_TOKEN' ? 'kWh' : 'litre'}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'receipt',
      header: '',
      srHeader: 'Receipt and actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.documentsCount > 0 ? (
            <Badge variant="neutral" className="gap-1">
              <Paperclip className="h-3 w-3" aria-hidden="true" />
              {row.documentsCount}
              <span className="sr-only"> {row.documentsCount === 1 ? 'receipt' : 'receipts'}</span>
            </Badge>
          ) : null}
          {!row.voidedAt && (
            <IconButton
              size="sm"
              variant="ghost"
              label={`Void this ${PURCHASE_KIND_LABELS[row.kind].toLowerCase()} entry`}
              icon={<Ban />}
              onClick={() => setVoiding(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        caption={caption}
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        isLoading={query.isLoading}
        minWidth="640px"
        emptyState={
          <EmptyState
            icon={ReceiptText}
            size="compact"
            bare
            title={query.isError ? 'Entries could not be loaded' : emptyTitle}
            description={query.isError ? 'Refresh the page to try again.' : emptyDescription}
          />
        }
      />
      {(query.data?.total ?? 0) > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={query.data?.total ?? 0}
          onPageChange={setPage}
          className="mt-3"
        />
      )}
      <ReasonDialog
        open={!!voiding}
        onOpenChange={(open) => !open && setVoiding(null)}
        title="Void this entry"
        description="Voided entries stay on the record, struck through, with your reason. You can void your own entries for 24 hours; after that the owner or agency can."
        reasonLabel="Why is it being voided?"
        reasonPlaceholder="e.g. Wrong amount, re-entered correctly"
        minLength={3}
        maxLength={500}
        confirmLabel="Void entry"
        tone="danger"
        error={voidPurchase.error?.message}
        onSubmit={({ reason }) =>
          voidPurchase.mutateAsync({ id: voiding!.id, reason }).then(() => setVoiding(null))
        }
      />
    </>
  );
}
