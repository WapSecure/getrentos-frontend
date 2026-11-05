'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { DataTable, type Column, PageHeader } from '@getrentos/ui';
import { EmptyState, PageErrorState, Pagination, SearchInput, Select } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { useAdminSearchParam } from '@/lib/readAdminSearchParam';
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
  const [search, setSearch] = useAdminSearchParam();
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
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

  const filterOptions = useMemo(
    () => [{ value: 'all', label: 'All statuses' }, ...config.statusOptions],
    [config.statusOptions]
  );

  if (isError && !data) {
    return (
      <PageErrorState
        title={`Could not load ${config.eyebrow.toLowerCase()}`}
        description="The rental records are temporarily unavailable. Your search and status filter have been preserved."
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
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search…"
              label={`Search ${config.eyebrow.toLowerCase()}`}
              className="w-full sm:w-56"
            />
            <div className="w-full sm:w-44">
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
