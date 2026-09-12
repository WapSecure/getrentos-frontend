'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Button,
  DataTable,
  EmptyState,
  Input,
  PageErrorState,
  Pagination,
  Select,
  type Column,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { readAdminSearchParam } from '@/lib/readAdminSearchParam';
import type { Paginated } from '@/services/adminService';
import type { MaintenanceQuery } from '@/services/adminMaintenanceService';

export interface MaintenanceQueueFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface MaintenanceQueueConfig<T> {
  /** API + query-key resource segment, e.g. 'work-orders'. */
  resource: string;
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  filters?: MaintenanceQueueFilter[];
  listFn: (params: MaintenanceQuery) => Promise<ApiResponse<Paginated<T>>>;
  getRowKey: (row: T) => string;
  columns: Column<T>[];
  actions?: (row: T) => ReactNode;
  headerAction?: ReactNode;
}

const PAGE_SIZE = 10;

export function MaintenanceQueuePage<T>({ config }: { config: MaintenanceQueueConfig<T> }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries((config.filters ?? []).map((filter) => [filter.key, 'all']))
  );
  const Icon = config.icon;

  useEffect(() => {
    setSearch(readAdminSearchParam());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo<MaintenanceQuery>(() => {
    const params: MaintenanceQuery = { search: debounced || undefined, page, pageSize: PAGE_SIZE };
    for (const filter of config.filters ?? []) {
      const value = filters[filter.key];
      if (value && value !== 'all') {
        (params as Record<string, unknown>)[filter.key] =
          filter.key === 'isActive' || filter.key === 'isEmergency' || filter.key === 'due'
            ? value === 'true'
            : value;
      }
    }
    return params;
  }, [debounced, page, filters, config.filters]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.maintenance(config.resource, queryParams),
    queryFn: () => unwrap(config.listFn(queryParams)),
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

  if (isError) {
    return (
      <PageErrorState
        title={`Could not load ${config.eyebrow.toLowerCase()}`}
        description="The maintenance records are temporarily unavailable. Your search and filters have been preserved."
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
            <Icon className="h-3 w-3" aria-hidden="true" />
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
          {config.headerAction}
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            aria-label={`Search ${config.eyebrow.toLowerCase()}`}
            leadingIcon={<Search className="h-4 w-4" aria-hidden="true" />}
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
