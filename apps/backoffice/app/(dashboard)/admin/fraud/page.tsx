'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldAlert } from '@sureground/icons';
import { FraudAlertCard } from '@/components/admin/fraud/FraudAlertCard';
import { FraudAlertDetailModal } from '@/components/admin/fraud/FraudAlertDetailModal';
import { NewFraudAlertModal } from '@/components/admin/fraud/NewFraudAlertModal';
import {
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  PageErrorState,
  PageHeader,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@sureground/ui';
import { Button } from '@sureground/ui';
import { Pagination } from '@sureground/ui';
import { Select } from '@sureground/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '../layout';
import type { FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';

type StatusFilter = 'all' | FraudAlertStatus;
type SeverityFilter = 'all' | FraudAlertSeverity;
type PendingDecision = { id: string; subjectName: string; status: 'cleared' | 'confirmed' };

const PAGE_SIZE = 12;

const STATUS_TOASTS: Record<FraudAlertStatus, (subject: string) => string> = {
  flagged: (subject) => `Alert on ${subject} flagged.`,
  investigating: (subject) => `Alert on ${subject} moved to investigating.`,
  cleared: (subject) => `Alert on ${subject} cleared.`,
  confirmed: (subject) => `Alert on ${subject} confirmed as fraud.`,
};

const DECISION_COPY: Record<
  PendingDecision['status'],
  {
    title: (subject: string) => string;
    description: string;
    label: string;
    tone: 'danger' | 'primary';
  }
> = {
  confirmed: {
    title: (subject) => `Confirm fraud by ${subject}?`,
    description:
      'This records the alert as confirmed fraud against this account and closes it. It stays in the audit log; reopen it from the alert if this was a mistake.',
    label: 'Confirm fraud',
    tone: 'danger',
  },
  cleared: {
    title: (subject) => `Clear the alert on ${subject}?`,
    description:
      'This records that no fraud was found and closes the alert. It stays in the audit log; reopen it from the alert if this was a mistake.',
    label: 'Clear alert',
    tone: 'primary',
  },
};

export default function AdminFraudPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const adminUser = useAdminUser();
  const canAttachEvidence = hasAdminPermission(adminUser?.roles, 'fraud.review');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [page, setPage] = useState(1);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.fraudAlerts({
      search: debouncedSearch,
      status: statusFilter,
      severity: severityFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        adminService.listFraudAlerts({
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          severity: severityFilter === 'all' ? undefined : severityFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const alerts = data?.items ?? [];
  const total = data?.total ?? 0;

  const updateStatusMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: ({ id, status }: { id: string; status: FraudAlertStatus; subjectName: string }) =>
      unwrap(adminService.updateFraudAlertStatus(id, status)),
    onSuccess: (_updated, { status, subjectName }) => {
      toast.success(STATUS_TOASTS[status](subjectName));
      return queryClient.invalidateQueries({ queryKey: ['admin', 'fraudAlerts'] });
    },
  });

  // Clearing or confirming is a decision about a named person, so it is never a single click.
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const updateStatus = (
    alert: { id: string; subjectName: string },
    status: Exclude<FraudAlertStatus, 'flagged'>
  ) => {
    if (status === 'investigating') {
      updateStatusMutation.mutate({ id: alert.id, status, subjectName: alert.subjectName });
      return;
    }
    setPendingDecision({ id: alert.id, subjectName: alert.subjectName, status });
  };

  const invalidateFraudAlerts = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'fraudAlerts'] });

  const { data: activeAlertDetail, isLoading: activeAlertDetailLoading } = useQuery({
    queryKey: adminKeys.fraudAlertDetail(activeAlertId ?? ''),
    queryFn: () => unwrap(adminService.getFraudAlertDetail(activeAlertId!)),
    enabled: !!activeAlertId,
  });

  const createMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: (params: {
      subjectUserId: string;
      reason: string;
      severity: FraudAlertSeverity;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }) => unwrap(adminService.createFraudAlert(params)),
    onSuccess: invalidateFraudAlerts,
  });

  const severityMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: ({ id, severity }: { id: string; severity: FraudAlertSeverity }) =>
      unwrap(adminService.updateFraudAlertSeverity(id, severity)),
    onSuccess: invalidateFraudAlerts,
  });

  const reopenMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: (id: string) => unwrap(adminService.reopenFraudAlert(id)),
    onSuccess: invalidateFraudAlerts,
  });

  const attachEvidenceMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: ({ id, file, note }: { id: string; file: File; note?: string }) =>
      unwrap(adminService.addFraudEvidence(id, file, note)),
    onSuccess: (_created, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.fraudAlertDetail(id) });
      invalidateFraudAlerts();
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-log'] });
    },
  });

  // Signed evidence links expire, so a viewer left open past the deadline asks for a fresh one.
  const resolveEvidenceUrl = async (evidenceId: string) => {
    if (!activeAlertId) return null;
    const fresh = await unwrap(adminService.getFraudAlertDetail(activeAlertId));
    const match = fresh.evidence?.find((entry) => entry.id === evidenceId);
    if (!match || match.kind !== 'STORED') return null;
    queryClient.setQueryData(adminKeys.fraudAlertDetail(activeAlertId), fresh);
    return match.url;
  };

  const { data: flaggedData, isError: flaggedCountError } = useQuery({
    queryKey: ['admin', 'fraudAlerts', 'count', 'flagged'],
    queryFn: () =>
      unwrap(adminService.listFraudAlerts({ status: 'flagged', page: 1, pageSize: 1 })),
  });
  const flaggedCount = flaggedData?.total ?? 0;

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'cleared', label: 'Cleared' },
    { value: 'confirmed', label: 'Confirmed' },
  ];

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: 'All severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fraud and risk review"
        description={
          flaggedCountError
            ? 'Flagged-alert count temporarily unavailable'
            : `${flaggedCount} alert${flaggedCount === 1 ? '' : 's'} awaiting triage`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" href="/admin/fraud/risk">
              Risk decisions
            </Button>
            <Button icon={<Plus />} onClick={() => setShowCreate(true)}>
              New alert
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          label="Search fraud alerts"
          placeholder="Search by subject or entity..."
          className="flex-1 max-w-sm"
        />
        <Select
          value={severityFilter}
          onValueChange={(value) => {
            setSeverityFilter(value as SeverityFilter);
            setPage(1);
          }}
          options={severityOptions}
          ariaLabel="Filter by severity"
          searchable={false}
          className="w-full sm:w-48"
        />
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(value) => {
          setStatusFilter(value as StatusFilter);
          setPage(1);
        }}
        className=""
      >
        <TabsList className="max-w-full">
          {statusOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError && !data ? (
        <PageErrorState
          title="Could not load fraud alerts"
          description="The risk-review queue is temporarily unavailable. Your filters have been preserved."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : alerts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No alerts match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {alerts.map((alert, index) => (
            <FraudAlertCard
              key={alert.id}
              alert={alert}
              delay={index * 0.05}
              onOpen={() => setActiveAlertId(alert.id)}
              onInvestigate={() => updateStatus(alert, 'investigating')}
              onClear={() => updateStatus(alert, 'cleared')}
              onConfirm={() => updateStatus(alert, 'confirmed')}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <NewFraudAlertModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (params) => {
          try {
            await createMutation.mutateAsync(params);
            return true;
          } catch {
            return false;
          }
        }}
        isCreating={createMutation.isPending}
      />

      <FraudAlertDetailModal
        alert={activeAlertDetail ?? null}
        loading={activeAlertDetailLoading}
        onClose={() => setActiveAlertId(null)}
        onSeverityChange={(id, severity) => severityMutation.mutate({ id, severity })}
        onStatusChange={(id, status) =>
          updateStatus(
            { id, subjectName: activeAlertDetail?.subject.legalName ?? 'this account' },
            status
          )
        }
        onReopen={(id) => reopenMutation.mutate(id)}
        isUpdating={
          updateStatusMutation.isPending || severityMutation.isPending || reopenMutation.isPending
        }
        onAttachEvidence={(file, note) => {
          if (activeAlertId) attachEvidenceMutation.mutate({ id: activeAlertId, file, note });
        }}
        canAttachEvidence={canAttachEvidence}
        isAttachingEvidence={attachEvidenceMutation.isPending}
        onResolveEvidenceUrl={resolveEvidenceUrl}
      />

      {pendingDecision ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingDecision(null);
          }}
          title={DECISION_COPY[pendingDecision.status].title(pendingDecision.subjectName)}
          description={DECISION_COPY[pendingDecision.status].description}
          confirmLabel={DECISION_COPY[pendingDecision.status].label}
          tone={DECISION_COPY[pendingDecision.status].tone}
          isLoading={updateStatusMutation.isPending}
          onConfirm={async () => {
            try {
              await updateStatusMutation.mutateAsync(pendingDecision);
            } catch {
              // The global mutation error handler already tells the reviewer it failed.
            }
            setPendingDecision(null);
          }}
        />
      ) : null}
    </div>
  );
}
