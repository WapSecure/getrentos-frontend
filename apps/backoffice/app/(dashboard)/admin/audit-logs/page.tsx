'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import {
  DataTable,
  PageErrorState,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
  type Column,
} from '@getrentos/ui';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { AuditLogEntry, AuditSeverity } from '@/types/admin';

const severityConfig: Record<AuditSeverity, { label: string; variant: BadgeVariant }> = {
  info: { label: 'Info', variant: 'info' },
  warning: { label: 'Warning', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
};

type SeverityFilter = 'all' | AuditSeverity;

const PAGE_SIZE = 10;

export default function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.auditLogs({
      search: debouncedSearch,
      severity: severityFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        adminService.listAuditLogs({
          search: debouncedSearch || undefined,
          severity: severityFilter === 'all' ? undefined : severityFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const logs: AuditLogEntry[] = data?.items ?? [];
  const total = data?.total ?? 0;

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const columns: Column<AuditLogEntry>[] = useMemo(
    () => [
      {
        key: 'actor',
        header: 'Actor',
        render: (log) => (
          <>
            <p className="font-medium text-foreground">{log.actorName}</p>
            <p className="text-xs text-muted-foreground capitalize">{log.actorRole}</p>
          </>
        ),
        className: 'whitespace-nowrap',
      },
      {
        key: 'action',
        header: 'Action',
        render: (log) => log.action,
        className: 'text-muted-foreground whitespace-nowrap',
      },
      {
        key: 'target',
        header: 'Target',
        render: (log) => log.target,
        className: 'text-muted-foreground whitespace-nowrap',
      },
      {
        key: 'severity',
        header: 'Severity',
        render: (log) => (
          <Badge variant={severityConfig[log.severity].variant}>
            {severityConfig[log.severity].label}
          </Badge>
        ),
        className: 'whitespace-nowrap',
      },
      {
        key: 'ip',
        header: 'IP Address',
        render: (log) => log.ipAddress,
        className: 'text-muted-foreground whitespace-nowrap font-mono text-xs',
      },
      {
        key: 'timestamp',
        header: 'Timestamp',
        render: (log) => formatDate(log.timestamp),
        className: 'text-muted-foreground whitespace-nowrap',
      },
    ],
    []
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          A record of sensitive actions taken across the platform
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          label="Search audit logs"
          placeholder="Search by actor, action, or target..."
          className="flex-1 max-w-sm"
        />
      </div>

      <Tabs
        value={severityFilter}
        onValueChange={(value) => {
          setSeverityFilter(value as SeverityFilter);
          setPage(1);
        }}
        className="mb-6"
      >
        <TabsList>
          {severityOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isError && !data ? (
        <PageErrorState
          title="Could not load audit logs"
          description="The sensitive-action record is temporarily unavailable. Your search and severity filter have been preserved."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          getRowKey={(log) => log.id}
          emptyState={<EmptyState icon={ScrollText} title="No log entries match your filters" />}
          footer={
            total > 0 && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            )
          }
        />
      )}
    </>
  );
}
