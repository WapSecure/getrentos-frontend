'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  type Column,
  DataTable,
  EmptyState,
  Input,
  Pagination,
  Select,
  ToggleChip,
} from '@getrentos/ui';
import { ReceiptText, Search } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { LAND_DEVELOPER_ROUTES } from '@/lib/constants/landDeveloperRoutes';
import { landDeveloperService } from '@/services/landDeveloperService';
import {
  LAND_PURCHASE_STATUSES,
  type LandPurchaseStatus,
  type LandPurchaseSummary,
  type OwnerLandLayoutSummary,
} from '@/types/landDeveloper';
import { PURCHASE_STATUS } from '../developer/labels';
import { LandPropertyNav } from '../developer/LandPropertyNav';
import { CollectionsSummaryCards } from './CollectionsSummaryCards';
import { useOwnerLayouts } from './useOwnerLayouts';

const PAGE_SIZE = 20;
const ALL = 'all';

interface SalesDeskProps {
  /** Opens the desk filtered to this parcel's estate (from the property navigation). */
  initialPropertyId?: string;
}

/** The chosen estate at a glance: whose it is and what is left to sell. */
const EstateSummary = ({ layout }: { layout: OwnerLandLayoutSummary }) => {
  const { plots } = layout;
  const figures = [
    { label: 'Available', value: plots.available },
    { label: 'Reserved', value: plots.reserved },
    { label: 'Paying', value: plots.underInstallment },
    { label: 'Sold', value: plots.sold + plots.allocated },
    { label: 'Withheld', value: plots.withheld },
  ];
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
          {layout.name}
          {layout.access === 'MANDATE' && <Badge variant="info">Selling under mandate</Badge>}
        </p>
        <p className="text-xs text-muted-foreground">
          {layout.propertyTitle} · {layout.city}, {layout.state} · {plots.total} plots
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-x-5 gap-y-2 text-sm sm:flex sm:gap-5">
        {figures.map((figure) => (
          <div key={figure.label}>
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd className="font-semibold text-foreground">{figure.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const columns: Column<LandPurchaseSummary>[] = [
  {
    key: 'reference',
    header: 'Purchase',
    render: (purchase) => (
      <div>
        <p className="font-medium text-foreground">{purchase.reference}</p>
        <p className="text-xs text-muted-foreground">{purchase.buyerName ?? 'Buyer'}</p>
      </div>
    ),
  },
  {
    key: 'plot',
    header: 'Plot',
    render: (purchase) => (
      <div>
        <p className="text-foreground">
          {purchase.block ? `${purchase.block} / ` : ''}
          {purchase.plotNumber}
        </p>
        <p className="text-xs text-muted-foreground">{purchase.layoutName}</p>
      </div>
    ),
  },
  {
    key: 'paid',
    header: 'Paid',
    render: (purchase) => {
      const share = purchase.totalPrice > 0 ? (purchase.amountPaid / purchase.totalPrice) * 100 : 0;
      return (
        <div className="min-w-[9rem]">
          <p className="whitespace-nowrap text-foreground">
            {formatCurrency(purchase.amountPaid, { compact: true })}
            <span className="text-muted-foreground">
              {' '}
              of {formatCurrency(purchase.totalPrice, { compact: true })}
            </span>
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-success" style={{ width: `${Math.min(100, share)}%` }} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{purchase.planName}</p>
        </div>
      );
    },
  },
  {
    key: 'next',
    header: 'Next due',
    render: (purchase) =>
      purchase.nextDue ? (
        <div className="whitespace-nowrap">
          <p className={purchase.nextDue.overdue ? 'text-destructive' : 'text-foreground'}>
            {formatCurrency(purchase.nextDue.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {purchase.nextDue.overdue ? 'Overdue since ' : ''}
            {formatDate(purchase.nextDue.dueDate)}
          </p>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (purchase) => {
      const status = PURCHASE_STATUS[purchase.status] ?? {
        label: purchase.status,
        variant: 'neutral' as const,
      };
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
  },
];

/** Plot purchases across the owner's estates, with collections at the top. */
export const SalesDesk = ({ initialPropertyId }: SalesDeskProps) => {
  const router = useRouter();
  const layouts = useOwnerLayouts();
  /** null until the owner picks an estate; until then the scoped one (or all) applies. */
  const [layoutChoice, setLayoutChoice] = useState<string | null>(null);
  const [status, setStatus] = useState<LandPurchaseStatus | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Preselect the estate of the parcel the owner came from, once layouts load.
  const scopedLayout = useMemo(
    () =>
      initialPropertyId
        ? layouts.data?.find((layout) => layout.propertyId === initialPropertyId)
        : undefined,
    [initialPropertyId, layouts.data]
  );
  const layoutId = layoutChoice ?? scopedLayout?.id ?? ALL;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeLayoutId = layoutId === ALL ? undefined : layoutId;
  const params = {
    page,
    pageSize: PAGE_SIZE,
    status,
    layoutId: activeLayoutId,
    search: search || undefined,
  };
  const { data, isLoading, isError, error } = useQuery({
    queryKey: landDeveloperKeys.purchaseList(params),
    queryFn: () => unwrap(landDeveloperService.listPurchases(params)),
    placeholderData: (previous) => previous,
  });

  const layoutOptions = [
    { value: ALL, label: 'All estates' },
    ...(layouts.data ?? []).map((layout) => ({
      value: layout.id,
      label: layout.access === 'MANDATE' ? `${layout.name} (mandate)` : layout.name,
      searchText: `${layout.name} ${layout.propertyTitle} ${layout.city}`,
    })),
  ];
  const statusOptions: { value: LandPurchaseStatus | undefined; label: string }[] = [
    { value: undefined, label: 'All' },
    ...LAND_PURCHASE_STATUSES.map((value) => ({ value, label: PURCHASE_STATUS[value].label })),
  ];
  const filtered = Boolean(status || activeLayoutId || search);
  const activeLayout = layouts.data?.find((layout) => layout.id === activeLayoutId);

  return (
    <>
      {initialPropertyId && (
        <LandPropertyNav propertyId={initialPropertyId} active="sales" className="mb-5" />
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">Plot sales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every plot purchase on your estates: what buyers have paid, what is owed and what is
          waiting on you to deliver.
        </p>
      </div>

      {initialPropertyId && layouts.isSuccess && !scopedLayout && (
        <p className="mb-4 rounded-xl border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          This parcel has no estate layout yet, so there are no plot sales on it. Showing every
          estate instead.{' '}
          <Link
            href={LAND_DEVELOPER_ROUTES.layout(initialPropertyId)}
            className="font-medium text-primary hover:underline"
          >
            Set up a layout
          </Link>
        </p>
      )}

      {activeLayout && <EstateSummary layout={activeLayout} />}

      <CollectionsSummaryCards layoutId={activeLayoutId} />

      <div className="mb-4 mt-8 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex w-max gap-2" role="group" aria-label="Purchase status">
            {statusOptions.map((option) => (
              <ToggleChip
                key={option.label}
                size="sm"
                pressed={status === option.value}
                onPressedChange={() => {
                  setStatus(option.value);
                  setPage(1);
                }}
              >
                {option.label}
              </ToggleChip>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={layoutId}
            onValueChange={(value) => {
              setLayoutChoice(value);
              setPage(1);
            }}
            options={layoutOptions}
            ariaLabel="Estate"
            searchable={layoutOptions.length > 8}
            className="sm:w-56"
            disabled={layouts.isLoading}
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Reference, plot or buyer"
            aria-label="Search purchases"
            leadingIcon={<Search className="h-4 w-4" />}
            className="sm:w-64"
          />
        </div>
      </div>

      {isError && !data ? (
        <Alert variant="danger">
          {error instanceof Error ? error.message : 'Purchases could not be loaded.'}
        </Alert>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowKey={(purchase) => purchase.id}
          onRowClick={(purchase) => router.push(LAND_DEVELOPER_ROUTES.purchase(purchase.id))}
          getRowClassName={() => 'cursor-pointer hover:bg-secondary/40'}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={ReceiptText}
              title={filtered ? 'No purchases match these filters' : 'No plot purchases yet'}
              description={
                filtered
                  ? 'Try another estate, status or search.'
                  : 'When a buyer reserves a plot and pays the deposit, the purchase appears here.'
              }
            />
          }
          footer={
            (data?.total ?? 0) > PAGE_SIZE ? (
              <div className="border-t border-border px-4 py-3">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={data?.total ?? 0}
                  onPageChange={setPage}
                />
              </div>
            ) : undefined
          }
        />
      )}
    </>
  );
};
