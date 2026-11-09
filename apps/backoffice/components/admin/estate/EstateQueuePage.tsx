'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SgIcon } from '@sureground/icons';
import {
  Button,
  DataTable,
  EmptyState,
  PageErrorState,
  Pagination,
  SearchInput,
  Select,
  type Column,
  PageHeader,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { Paginated } from '@/services/adminService';
import type { EstateQuery } from '@/services/adminEstateService';

export interface EstateQueueFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface EstateQueueConfig<T> {
  resource: string;
  eyebrow: string;
  title: string;
  description?: string;
  icon: SgIcon;
  filters?: EstateQueueFilter[];
  listFn: (params: EstateQuery) => Promise<ApiResponse<Paginated<T>>>;
  getRowKey: (row: T) => string;
  columns: Column<T>[];
  actions?: (row: T) => ReactNode;
}

const PAGE_SIZE = 10;

export function EstateQueuePage<T>({ config }: { config: EstateQueueConfig<T> }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
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

  const queryParams = useMemo<EstateQuery>(() => {
    const params: EstateQuery = { search: debounced || undefined, page, pageSize: PAGE_SIZE };
    for (const filter of config.filters ?? []) {
      const value = filters[filter.key];
      if (value && value !== 'all') {
        (params as Record<string, unknown>)[filter.key] =
          filter.key === 'residentLinked' ? value : value;
      }
    }
    return params;
  }, [debounced, page, filters, config.filters]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.estates(config.resource, queryParams),
    queryFn: () => unwrap(config.listFn(queryParams)),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasActiveFilters =
    Boolean(search.trim()) || Object.values(filters).some((value) => value !== 'all');

  const clearFilters = () => {
    setSearch('');
    setDebounced('');
    setFilters(Object.fromEntries((config.filters ?? []).map((filter) => [filter.key, 'all'])));
    setPage(1);
  };

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

  if (isError && !data) {
    return (
      <PageErrorState
        title={`Could not load ${config.eyebrow.toLowerCase()}`}
        description="The estate records are temporarily unavailable. Your search and filters have been preserved."
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
            description={
              hasActiveFilters
                ? 'No records match the current search and filters.'
                : 'No records have been created yet.'
            }
            action={
              hasActiveFilters ? (
                <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
        footer={
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        }
      />
    </div>
  );
}
