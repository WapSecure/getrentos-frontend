'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldAlert } from 'lucide-react';
import { FraudAlertCard } from '@/components/admin/fraud/FraudAlertCard';
import { EmptyState, PageErrorState } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { cn } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';

type StatusFilter = 'all' | FraudAlertStatus;
type SeverityFilter = 'all' | FraudAlertSeverity;

const PAGE_SIZE = 12;

export default function AdminFraudPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [page, setPage] = useState(1);

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
  });
  const alerts = data?.items ?? [];
  const total = data?.total ?? 0;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FraudAlertStatus }) =>
      unwrap(adminService.updateFraudAlertStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'fraudAlerts'] }),
  });

  const updateStatus = (id: string, status: FraudAlertStatus) => {
    if (status === 'flagged') return;
    updateStatusMutation.mutate({ id, status });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Fraud &amp; Risk Review</h1>
        <p className="text-muted-foreground mt-1">
          {flaggedCountError
            ? 'Flagged-alert count temporarily unavailable'
            : `${flaggedCount} alert${flaggedCount === 1 ? '' : 's'} awaiting triage`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by subject or entity..."
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={severityFilter}
          onValueChange={(value) => {
            setSeverityFilter(value as SeverityFilter);
            setPage(1);
          }}
          options={severityOptions}
          className="w-full sm:w-48"
        />
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setStatusFilter(option.value);
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              statusFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isError ? (
        <PageErrorState
          title="Could not load fraud alerts"
          description="The risk-review queue is temporarily unavailable. Your filters have been preserved."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No alerts match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {alerts.map((alert, index) => (
            <FraudAlertCard
              key={alert.id}
              alert={alert}
              delay={index * 0.05}
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
    </>
  );
}
