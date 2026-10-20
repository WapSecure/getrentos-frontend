'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldAlert } from 'lucide-react';
import { FraudAlertCard } from '@/components/admin/fraud/FraudAlertCard';
import { FraudAlertDetailModal } from '@/components/admin/fraud/FraudAlertDetailModal';
import { NewFraudAlertModal } from '@/components/admin/fraud/NewFraudAlertModal';
import {
  CardSkeleton,
  EmptyState,
  PageErrorState,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '../layout';
import type { FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';

type StatusFilter = 'all' | FraudAlertStatus;
type SeverityFilter = 'all' | FraudAlertSeverity;

const PAGE_SIZE = 12;

export default function AdminFraudPage() {
  const queryClient = useQueryClient();
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
    mutationFn: ({ id, status }: { id: string; status: FraudAlertStatus }) =>
      unwrap(adminService.updateFraudAlertStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'fraudAlerts'] }),
  });

  const updateStatus = (id: string, status: FraudAlertStatus) => {
    if (status === 'flagged') return;
    updateStatusMutation.mutate({ id, status });
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
      // The new file lands in the audit log with everything else on the alert.
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-log'] });
    },
  });

  /**
   * Signed evidence links expire, so a viewer left open past the deadline asks
   * for a fresh one rather than failing.
   */
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
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fraud &amp; Risk Review</h1>
          <p className="text-muted-foreground mt-1">
            {flaggedCountError
              ? 'Flagged-alert count temporarily unavailable'
              : `${flaggedCount} alert${flaggedCount === 1 ? '' : 's'} awaiting triage`}
          </p>
        </div>
        <Button
          className="shrink-0"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreate(true)}
        >
          New alert
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
        className="mb-6"
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
              onInvestigate={() => updateStatus(alert.id, 'investigating')}
              onClear={() => updateStatus(alert.id, 'cleared')}
              onConfirm={() => updateStatus(alert.id, 'confirmed')}
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
        onStatusChange={(id, status) => updateStatus(id, status)}
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
    </>
  );
}
