'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ScrollText } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/Table';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
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
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.auditLogs({ search: searchQuery, severity: severityFilter, page }),
    queryFn: () =>
      unwrap(
        adminService.listAuditLogs({
          search: searchQuery || undefined,
          severity: severityFilter === 'all' ? undefined : severityFilter,
          page,
          limit: PAGE_SIZE,
        })
      ),
  });
  const logs: AuditLogEntry[] = data?.items ?? [];
  const total = data?.total ?? 0;

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ];

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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by actor, action, or target..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {severityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setSeverityFilter(option.value);
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              severityFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

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
    </>
  );
}
