'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import {
  Button,
  DataTable,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
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
import { roleLabel } from '@/lib/roleLabels';

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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [openEntry, setOpenEntry] = useState<AuditLogEntry | null>(null);

  const { data, error, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.auditLogs({
      search: debouncedSearch,
      severity: severityFilter,
      dateFrom,
      dateTo,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        adminService.listAuditLogs({
          search: debouncedSearch || undefined,
          severity: severityFilter === 'all' ? undefined : severityFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
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
            <p className="text-xs text-muted-foreground">{roleLabel(log.actorRole)}</p>
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
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker
            ariaLabel="From date"
            placeholder="From"
            value={dateFrom}
            max={dateTo || undefined}
            clearable
            onChange={(value) => {
              setDateFrom(value);
              setPage(1);
            }}
            className="w-40"
          />
          <DatePicker
            ariaLabel="To date"
            placeholder="To"
            value={dateTo}
            min={dateFrom || undefined}
            clearable
            onChange={(value) => {
              setDateTo(value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
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
          error={error}
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
          onRowClick={(log) => setOpenEntry(log)}
          emptyState={<EmptyState icon={ScrollText} title="No log entries match your filters" />}
          footer={
            total > 0 && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            )
          }
        />
      )}

      <AuditEntryDialog entry={openEntry} onClose={() => setOpenEntry(null)} />
    </>
  );
}

const formatValue = (value: unknown) =>
  value === null || value === undefined
    ? ''
    : typeof value === 'string'
      ? value
      : JSON.stringify(value);

/** The fields an action changed: before and after, side by side. */
function changedFields(oldValues: unknown, newValues: unknown) {
  const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const before = asRecord(oldValues);
  const after = asRecord(newValues);
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].map((field) => ({
    field,
    before: formatValue(before[field]),
    after: formatValue(after[field]),
  }));
}

function AuditEntryDialog({
  entry,
  onClose,
}: {
  entry: AuditLogEntry | null;
  onClose: () => void;
}) {
  const fields = entry ? changedFields(entry.oldValues, entry.newValues) : [];
  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      {entry && (
        <DialogContent size="lg">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {entry.action}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {entry.actorName} ({roleLabel(entry.actorRole)}) · {formatDate(entry.timestamp, 'long')}
          </DialogDescription>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Record</dt>
            <dd className="break-all font-mono text-xs">{entry.target}</dd>
            {entry.ipAddress && (
              <>
                <dt className="text-muted-foreground">IP address</dt>
                <dd className="font-mono text-xs">{entry.ipAddress}</dd>
              </>
            )}
          </dl>
          <h3 className="mt-5 text-sm font-semibold text-foreground">What changed</h3>
          {fields.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              No before or after values were recorded for this action.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Field
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Before
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      After
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fields.map((row) => (
                    <tr key={row.field}>
                      <th scope="row" className="px-3 py-2 font-medium text-foreground">
                        {row.field}
                      </th>
                      <td className="break-all px-3 py-2 font-mono text-xs text-muted-foreground">
                        {row.before || '—'}
                      </td>
                      <td className="break-all px-3 py-2 font-mono text-xs text-foreground">
                        {row.after || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
