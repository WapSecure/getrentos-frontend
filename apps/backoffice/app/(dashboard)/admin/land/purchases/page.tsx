'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CircleAlert, FileSignature, RefreshCw, X } from 'lucide-react';
import {
  Button,
  DataTable,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  type Column,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { humaniseEnum, isRefundableTermination, landQueryKeys } from '@/lib/landDiligence';
import {
  adminLandPurchaseService,
  type ListAdminLandPurchasesParams,
} from '@/services/adminLandPurchaseService';
import {
  LAND_PURCHASE_STATUSES,
  type LandPurchaseStatus,
  type LandPurchaseSummary,
} from '@/types/landPurchase';
import { LandPurchaseStatusBadge } from '@/components/admin/land/purchases/LandPurchaseStatusBadge';

const PAGE_SIZE = 20;
const purchaseHref = (id: string) => `/admin/land/purchases/${encodeURIComponent(id)}`;

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  ...LAND_PURCHASE_STATUSES.map((status) => ({ value: status, label: humaniseEnum(status) })),
];

export default function AdminLandPurchasesPage() {
  const router = useRouter();
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'sales.view');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'all' | LandPurchaseStatus>('all');
  const [layout, setLayout] = useState<{ id: string; name: string } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo<ListAdminLandPurchasesParams>(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
      layoutId: layout?.id,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, layout?.id, page, status]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: landQueryKeys.purchases(params),
    queryFn: () => unwrap(adminLandPurchaseService.list(params)),
    enabled: canView,
    placeholderData: keepPreviousData,
  });
  const purchases = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: Column<LandPurchaseSummary>[] = [
    {
      key: 'reference',
      header: 'Purchase',
      render: (purchase) => (
        <div className="min-w-[11rem]">
          <Link
            href={purchaseHref(purchase.id)}
            onClick={(event) => event.stopPropagation()}
            className="font-mono text-sm font-medium text-foreground hover:text-primary hover:underline"
          >
            {purchase.reference}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <button
              type="button"
              className="hover:text-primary hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                setLayout({ id: purchase.layoutId, name: purchase.layoutName });
                setPage(1);
              }}
              title="Show only this layout"
            >
              {purchase.layoutName}
            </button>
            {` · Plot ${purchase.plotNumber}`}
            {purchase.block && ` · Block ${purchase.block}`}
          </p>
        </div>
      ),
    },
    {
      key: 'buyer',
      header: 'Buyer / plan',
      render: (purchase) => (
        <div className="text-sm">
          <p className="text-foreground">{purchase.buyerName ?? 'Unknown buyer'}</p>
          <p className="text-xs text-muted-foreground">{purchase.planName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (purchase) => <LandPurchaseStatusBadge status={purchase.status} />,
    },
    {
      key: 'money',
      header: 'Paid / total',
      render: (purchase) => (
        <div className="whitespace-nowrap text-sm">
          <p className="text-foreground">
            {formatCurrency(purchase.amountPaid)}{' '}
            <span className="text-muted-foreground">/ {formatCurrency(purchase.totalPrice)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Outstanding {formatCurrency(purchase.outstandingBalance)}
          </p>
        </div>
      ),
    },
    {
      key: 'next',
      header: 'Next due / refund',
      render: (purchase) =>
        isRefundableTermination(purchase.status) ? (
          purchase.refundDue !== undefined ? (
            <p className="whitespace-nowrap text-sm font-semibold text-warning">
              Refund due {formatCurrency(purchase.refundDue)}
            </p>
          ) : (
            <span className="text-sm text-muted-foreground">No refund recorded</span>
          )
        ) : purchase.nextDue ? (
          <div
            className={`whitespace-nowrap text-sm ${
              purchase.nextDue.overdue ? 'font-semibold text-destructive' : 'text-foreground'
            }`}
          >
            {purchase.nextDue.overdue && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
            {formatCurrency(purchase.nextDue.amount)}
            <p className="text-xs font-normal text-muted-foreground">
              {formatDate(purchase.nextDue.dueDate)}
            </p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'created',
      header: 'Started',
      render: (purchase) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(purchase.startedAt ?? purchase.createdAt)}
        </span>
      ),
    },
  ];

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to land purchases"
        description="Viewing plot purchases needs the sales view permission."
      />
    );
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent p-2.5 text-primary">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <h1 className="type-title">Land purchases</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Every developer plot purchase: what buyers have paid, what is overdue, conveyance
              progress, and what is owed back on revoked or cancelled contracts.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          isLoading={isFetching && !isLoading}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full max-w-lg">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search reference, plot number or buyer…"
            label="Search land purchases"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as 'all' | LandPurchaseStatus);
            setPage(1);
          }}
          options={statusOptions}
          ariaLabel="Filter purchase status"
          className="w-full sm:w-52"
        />
        {layout && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLayout(null);
              setPage(1);
            }}
            icon={<X className="h-3.5 w-3.5" />}
          >
            Layout: {layout.name}
          </Button>
        )}
      </div>

      {isError && !data ? (
        <EmptyState
          icon={CircleAlert}
          title="Land purchases could not be loaded"
          description={error instanceof Error ? error.message : 'Please try again.'}
          action={
            <Button
              variant="outline"
              onClick={() => refetch()}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Try again
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={purchases}
          getRowKey={(purchase) => purchase.id}
          onRowClick={(purchase) => router.push(purchaseHref(purchase.id))}
          getRowClassName={(purchase) =>
            purchase.nextDue?.overdue || purchase.status === 'DEFAULTED'
              ? 'bg-destructive/5 hover:bg-destructive/10'
              : undefined
          }
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={FileSignature}
              title="No purchases match these filters"
              description="Plot purchases appear here once a buyer converts a reservation into a contract."
            />
          }
        />
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-7"
        />
      )}
    </>
  );
}
