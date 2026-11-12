'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Database, FolderOpen, Lock, ShieldCheck, Upload } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  StatCard,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
  type BadgeVariant,
} from '@sureground/ui';
import { formatDate, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import type { AdminMediaHealth, AdminMediaItem } from '@/types/admin';

const PAGE_SIZE = 20;

type ClassFilter = 'all' | AdminMediaItem['classification'];

const CLASS_FILTERS: { value: ClassFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'CONFIDENTIAL', label: 'Confidential' },
  { value: 'RESTRICTED', label: 'Restricted' },
  { value: 'PUBLIC', label: 'Public' },
];

const CLASS_BADGE: Record<
  AdminMediaItem['classification'],
  { label: string; variant: BadgeVariant }
> = {
  CONFIDENTIAL: { label: 'Confidential', variant: 'danger' },
  RESTRICTED: { label: 'Restricted', variant: 'warning' },
  PUBLIC: { label: 'Public', variant: 'neutral' },
};

function formatSize(bytes: number | null): string {
  if (bytes == null) return 'Size unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The file name after the upload id, for a readable row; the full key stays in the title for support. */
function displayName(key: string): string {
  const name = key.slice(key.lastIndexOf('/') + 1);
  return (
    name.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '') || name
  );
}

function formatGb(gb: number): string {
  if (gb < 1) return `${Math.round(gb * 1024)} MB`;
  return `${gb.toFixed(gb < 10 ? 2 : 1)} GB`;
}

function budgetNote(used: number, budget: number): string | undefined {
  return budget > 0
    ? `${Math.round((used / budget) * 100)}% of ${formatGb(budget)} budget`
    : undefined;
}

/** Storage, uploads, backlog and holds from the hourly media health check, with any alerts on top. */
function MediaHealthStrip({ health }: { health: AdminMediaHealth }) {
  const { stats, limits, alerts } = health;
  return (
    <div className="mb-6 space-y-4">
      {alerts.map((alert) => (
        <Alert
          key={alert.code}
          variant={alert.severity === 'critical' ? 'danger' : 'warning'}
          title={alert.severity === 'critical' ? 'Needs action' : 'Worth a look'}
        >
          {alert.message}
        </Alert>
      ))}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Database}
          label="Stored"
          value={formatGb(stats.storedGb)}
          subtitle={
            budgetNote(stats.storedGb, limits.storageBudgetGb) ??
            `${stats.storedFiles} file${stats.storedFiles === 1 ? '' : 's'}`
          }
        />
        <StatCard
          icon={Upload}
          label="Uploaded this month"
          value={formatGb(stats.uploadedThisMonthGb)}
          subtitle={budgetNote(stats.uploadedThisMonthGb, limits.monthlyUploadBudgetGb)}
        />
        <StatCard
          icon={Clock}
          label="Waiting over an hour"
          value={stats.processingOverAnHour}
          subtitle={`${stats.rejectedLast24h} rejected in the last 24 hours`}
          accent={stats.processingOverAnHour > limits.processingBacklog ? 'orange' : 'emerald'}
        />
        <StatCard
          icon={Lock}
          label="Under legal hold"
          value={stats.legalHolds}
          subtitle={`Checked ${formatDate(health.checkedAt)}`}
        />
      </div>
    </div>
  );
}

export default function AdminMediaPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState<ClassFilter>('all');
  const [heldOnly, setHeldOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminMediaItem | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.media({ search, classification, held: heldOnly, page }),
    queryFn: () =>
      unwrap(
        adminService.listMedia({
          search: search || undefined,
          classification: classification === 'all' ? undefined : classification,
          held: heldOnly,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  // Best-effort: the list works without it.
  const health = useQuery({
    queryKey: adminKeys.mediaHealth(),
    queryFn: () => unwrap(adminService.getMediaHealth()),
    staleTime: 60_000,
  });

  const toggle = useMutation({
    mutationFn: (item: AdminMediaItem) =>
      unwrap(adminService.setMediaHold(item.objectKey, !item.legalHold, reason.trim())),
    onSuccess: (result) => {
      toast.success(
        result.legalHold ? 'The file is now under legal hold.' : 'The legal hold was released.'
      );
      setTarget(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
    onError: (error: Error) => toast.error(error.message || 'The legal hold could not be changed.'),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const releasing = !!target?.legalHold;

  return (
    <>
      <PageHeader
        title="Media"
        description={
          isError && !data
            ? 'Stored files, their access level and legal holds'
            : `Stored files, their access level and legal holds · ${total} file${total === 1 ? '' : 's'}`
        }
      />

      {health.data && <MediaHealthStrip health={health.data} />}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          label="Search media"
          placeholder="Folder, file key, owner or uploader id"
          className="max-w-sm flex-1"
        />
        <Tabs
          value={classification}
          onValueChange={(value) => {
            setClassification(value as ClassFilter);
            setPage(1);
          }}
        >
          <TabsList className="max-w-full">
            {CLASS_FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Switch
            size="sm"
            checked={heldOnly}
            onCheckedChange={(checked) => {
              setHeldOnly(checked);
              setPage(1);
            }}
            aria-label="Show only files under legal hold"
          />
          Under legal hold only
        </label>
      </div>

      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : isError && !data ? (
        <PageErrorState
          title="Could not load media"
          description="The media registry is temporarily unavailable. Your search and filters have been kept."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No files found" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
          {items.map((item) => {
            const cls = CLASS_BADGE[item.classification];
            return (
              <div key={item.objectKey} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium text-foreground"
                    title={item.objectKey}
                  >
                    {displayName(item.objectKey)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.folder} · {formatSize(item.sizeBytes)} · {formatDate(item.createdAt)}
                    {item.ownerType ? ` · ${item.ownerType} ${item.ownerId ?? ''}` : ''}
                  </p>
                </div>
                <Badge variant={cls.variant}>{cls.label}</Badge>
                {item.status === 'DELETED' ? <Badge variant="neutral">Deleted</Badge> : null}
                {item.legalHold ? (
                  <Badge variant="info" icon={<ShieldCheck className="h-3 w-3" />}>
                    Legal hold
                  </Badge>
                ) : null}
                <Button
                  variant={item.legalHold ? 'outline' : 'secondary'}
                  size="sm"
                  disabled={item.status === 'DELETED'}
                  onClick={() => setTarget(item)}
                >
                  {item.legalHold ? 'Release hold' : 'Put on hold'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null);
            setReason('');
          }
        }}
        title={releasing ? 'Release the legal hold?' : 'Put this file under legal hold?'}
        description={
          releasing
            ? 'The file can be deleted again by retention and clean-up. The reason is kept in the audit log.'
            : 'The file cannot be deleted while the hold is on, not even by retention or clean-up. The reason is kept in the audit log.'
        }
        confirmLabel={releasing ? 'Release hold' : 'Put on hold'}
        tone={releasing ? 'danger' : 'primary'}
        promptLabel="Reason"
        promptPlaceholder={
          releasing ? 'Why the hold is no longer needed' : 'Case, request or regulation'
        }
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired
        promptMinLength={10}
        isLoading={toggle.isPending}
        onConfirm={() => (target ? toggle.mutateAsync(target) : undefined)}
      />
    </>
  );
}
