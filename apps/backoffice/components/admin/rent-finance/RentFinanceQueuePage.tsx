'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Button,
  DataTable,
  EmptyState,
  PageErrorState,
  Pagination,
  SearchInput,
  Select,
  useToast,
  type Column,
  PageHeader,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import { useAdminSearchParam } from '@/lib/readAdminSearchParam';
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
  /** Extra control rendered in the header, before the export button (e.g. "Generate statement"). */
  headerActions?: ReactNode;
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
  const [search, setSearch] = useAdminSearchParam();
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries((config.filters ?? []).map((filter) => [filter.key, 'all']))
  );

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

  const { data, error, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.rentFinance(config.resource, queryParams),
    queryFn: () => unwrap(config.listFn(queryParams)),
    placeholderData: keepPreviousData,
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
      toast.success('CSV export downloaded successfully.');
    } catch {
      toast.error('We could not export these records. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [config, queryParams, toast]);

  if (isError && !data) {
    return (
      <PageErrorState
        error={error}
        title={`Could not load ${config.eyebrow.toLowerCase()}`}
        description="The finance records are temporarily unavailable. Your filters have been preserved."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={
          <>
            {config.headerActions}
            {config.exportFn && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runExport}
                isLoading={exporting}
                loadingText="Exporting…"
                icon={<Download className="h-4 w-4" />}
              >
                Export CSV
              </Button>
            )}
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search…"
              label={`Search ${config.eyebrow.toLowerCase()}`}
              className="w-full sm:w-56"
            />
            {config.filters?.map((filter) => (
              <div key={filter.key} className="w-full sm:w-44">
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
          </>
        }
      />

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
    </div>
  );
}
