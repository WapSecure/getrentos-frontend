'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Button,
  DataTable,
  EmptyState,
  Input,
  PageErrorState,
  Pagination,
  Select,
  Toast,
  type Column,
  type ToastVariant,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { Paginated } from '@/services/adminService';
import type { RentFinanceQuery } from '@/services/adminRentFinanceService';

export interface RentFinanceQueueFilter {
  /** Query param the select maps to (status / escrowStatus / category / verified). */
  key: 'status' | 'escrowStatus' | 'category' | 'verified';
  label: string;
  options: { value: string; label: string }[];
}

export interface RentFinanceQueueConfig<T> {
  /** API + query-key resource segment, e.g. 'payments'. */
  resource: string;
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  filters?: RentFinanceQueueFilter[];
  listFn: (params: RentFinanceQuery) => Promise<ApiResponse<Paginated<T>>>;
  exportFn?: (params: RentFinanceQuery) => Promise<Blob>;
  exportFilename?: string;
  getRowKey: (row: T) => string;
  columns: Column<T>[];
  actions?: (row: T) => ReactNode;
}

const PAGE_SIZE = 10;

/** Triggers a browser download for an authenticated CSV blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function RentFinanceQueuePage<T>({ config }: { config: RentFinanceQueueConfig<T> }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries((config.filters ?? []).map((filter) => [filter.key, 'all']))
  );
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo<RentFinanceQuery>(() => {
    const params: RentFinanceQuery = { search: debounced || undefined, page, pageSize: PAGE_SIZE };
    for (const filter of config.filters ?? []) {
      const value = filters[filter.key];
      if (value && value !== 'all') {
        (params as Record<string, unknown>)[filter.key] =
          filter.key === 'verified' ? value === 'true' : value;
      }
    }
    return params;
  }, [debounced, page, filters, config.filters]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.rentFinance(config.resource, queryParams),
    queryFn: () => unwrap(config.listFn(queryParams)),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns = useMemo(() => {
    if (!config.actions) return config.columns;
    return [
      ...config.columns,
      {
        key: 'actions',
        header: 'Actions',
        render: config.actions,
        className: 'text-right',
      } as Column<T>,
    ];
  }, [config]);

  const runExport = useCallback(async () => {
    if (!config.exportFn) return;
    setExporting(true);
    try {
      const blob = await config.exportFn(queryParams);
      downloadBlob(blob, config.exportFilename ?? `${config.resource}.csv`);
      setToast({ message: 'CSV export downloaded successfully.', variant: 'success' });
    } catch {
      setToast({
        message: 'We could not export these records. Please try again.',
        variant: 'error',
      });
    } finally {
      setExporting(false);
    }
  }, [config, queryParams]);

  if (isError) {
    return (
      <PageErrorState
        title={`Could not load ${config.eyebrow.toLowerCase()}`}
        description="The finance records are temporarily unavailable. Your filters have been preserved."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            <Icon className="h-3 w-3" />
            {config.eyebrow}
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {config.title}
          </h1>
          {config.description && (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {config.exportFn && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={runExport}
              disabled={exporting}
            >
              <Download className="mr-1.5 h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          )}
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            aria-label={`Search ${config.eyebrow.toLowerCase()}`}
            leadingIcon={<Search className="h-4 w-4" />}
            className="w-56"
          />
          {config.filters?.map((filter) => (
            <div key={filter.key} className="w-44">
              <Select
                value={filters[filter.key]}
                onValueChange={(value) => {
                  setFilters((prev) => ({ ...prev, [filter.key]: value }));
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: `All ${filter.label.toLowerCase()}` },
                  ...filter.options,
                ]}
                ariaLabel={filter.label}
              />
            </div>
          ))}
        </div>
      </div>

      <DataTable<T>
        columns={columns}
        data={items}
        getRowKey={config.getRowKey}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={config.icon}
            title={`No ${config.eyebrow.toLowerCase()} found`}
            description="No records match the current filters."
          />
        }
        footer={
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        }
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
