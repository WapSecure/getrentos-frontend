'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldAlert } from 'lucide-react';
import { FraudAlertCard } from '@/components/admin/fraud/FraudAlertCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
import { adminKeys } from '@/lib/queryKeys';
import type { FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';

type StatusFilter = 'all' | FraudAlertStatus;
type SeverityFilter = 'all' | FraudAlertSeverity;

export default function AdminFraudPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: adminKeys.fraudAlerts(),
    queryFn: () => unwrap(adminService.listFraudAlerts()),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FraudAlertStatus }) =>
      unwrap(adminService.updateFraudAlertStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.fraudAlerts() }),
  });

  const updateStatus = (id: string, status: FraudAlertStatus) => {
    if (status === 'flagged') return;
    updateStatusMutation.mutate({ id, status });
  };

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((a) => {
        const matchesSearch =
          a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.relatedEntity.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
        return matchesSearch && matchesStatus && matchesSeverity;
      }),
    [alerts, searchQuery, statusFilter, severityFilter]
  );

  const flaggedCount = useMemo(() => alerts.filter((a) => a.status === 'flagged').length, [alerts]);

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
          {flaggedCount} alert{flaggedCount === 1 ? '' : 's'} awaiting triage
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject or entity..."
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={severityFilter}
          onValueChange={(value) => setSeverityFilter(value as SeverityFilter)}
          options={severityOptions}
          className="w-full sm:w-48"
        />
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
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

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No alerts match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlerts.map((alert, index) => (
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
    </>
  );
}
