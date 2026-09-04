'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DataTable, type Column } from '@getrentos/ui';
import { EmptyState, Input, Pagination, Select } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { Paginated } from '@/services/adminService';
import type { RentalListParams } from '@/services/adminRentalService';

export interface RentalQueueConfig<T> {
  /** API + query-key resource segment, e.g. 'listings'. */
  resource: string;
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  statusOptions: { value: string; label: string }[];
  listFn: (params: RentalListParams) => Promise<ApiResponse<Paginated<T>>>;
  getRowKey: (row: T) => string;
  columns: Column<T>[];
  actions?: (row: T) => ReactNode;
}

const PAGE_SIZE = 10;

export function RentalQueuePage<T>({ config }: { config: RentalQueueConfig<T> }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.rentals(config.resource, {
      search: debounced,
      status,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        config.listFn({
          search: debounced || undefined,
          status: status === 'all' ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
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

  const filterOptions = useMemo(
    () => [{ value: 'all', label: 'All statuses' }, ...config.statusOptions],
    [config.statusOptions]
  );

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
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            aria-label={`Search ${config.eyebrow.toLowerCase()}`}
            leadingIcon={<Search className="h-4 w-4" />}
            className="w-56"
          />
          <div className="w-44">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={filterOptions}
              ariaLabel="Filter by status"
            />
          </div>
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
    </div>
  );
}
