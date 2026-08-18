'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert, Plus } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { ReportViolationModal } from '@/components/estate/violations/ReportViolationModal';
import { CloseViolationModal } from '@/components/estate/violations/CloseViolationModal';
import { ViolationCard } from '@/components/estate/violations/ViolationCard';
import type { ViolationStatus } from '@/types/estate';

const statusFilters: { value: ViolationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reported', label: 'Reported' },
  { value: 'warning_issued', label: 'Warning Issued' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function EstateViolationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ViolationStatus | 'all'>('all');
  const [closeTarget, setCloseTarget] = useState<{
    id: string;
    action: 'resolve' | 'dismiss';
  } | null>(null);

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data: households = [] } = useQuery({
    queryKey: estateKeys.households(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listHouseholds(estate!.id)),
    enabled: !!estate,
  });

  const { data: violations = [], isLoading: isViolationsLoading } = useQuery({
    queryKey: estateKeys.violations(
      estate?.id ?? '',
      statusFilter === 'all' ? undefined : statusFilter
    ),
    queryFn: () =>
      unwrap(
        estateService.listViolations(estate!.id, statusFilter === 'all' ? undefined : statusFilter)
      ),
    enabled: !!estate,
  });

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'violations'] });
  };

  const reportViolation = useMutation({
    mutationFn: (data: Parameters<typeof estateService.reportViolation>[1]) =>
      unwrap(estateService.reportViolation(estate!.id, data)),
    onSuccess: () => {
      invalidate();
      setIsReportOpen(false);
    },
  });

  const warnMutation = useMutation({
    mutationFn: (violationId: string) =>
      unwrap(estateService.issueViolationWarning(estate!.id, violationId)),
    onSuccess: invalidate,
  });

  const closeMutation = useMutation({
    mutationFn: ({
      id,
      action,
      resolutionNotes,
    }: {
      id: string;
      action: 'resolve' | 'dismiss';
      resolutionNotes?: string;
    }) =>
      unwrap(
        action === 'resolve'
          ? estateService.resolveViolation(estate!.id, id, resolutionNotes)
          : estateService.dismissViolation(estate!.id, id, resolutionNotes)
      ),
    onSuccess: () => {
      invalidate();
      setCloseTarget(null);
    },
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Violations</h1>
          <p className="text-muted-foreground mt-1">
            {violations.length} violation{violations.length === 1 ? '' : 's'} in {estate.name}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsReportOpen(true)}>
          <Plus className="w-4 h-4" />
          Report Violation
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isViolationsLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : violations.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={TriangleAlert}
            title="No violations reported"
            description="Report a household rule violation to start tracking it here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {violations.map((violation) => (
            <ViolationCard
              key={violation.id}
              violation={violation}
              onWarn={() => warnMutation.mutate(violation.id)}
              onResolve={() => setCloseTarget({ id: violation.id, action: 'resolve' })}
              onDismiss={() => setCloseTarget({ id: violation.id, action: 'dismiss' })}
              isUpdating={warnMutation.isPending || closeMutation.isPending}
            />
          ))}
        </div>
      )}

      <ReportViolationModal
        isOpen={isReportOpen}
        households={households}
        onClose={() => setIsReportOpen(false)}
        onSubmit={(data) => reportViolation.mutate(data)}
        isSubmitting={reportViolation.isPending}
      />

      <CloseViolationModal
        isOpen={!!closeTarget}
        action={closeTarget?.action ?? null}
        onClose={() => setCloseTarget(null)}
        onConfirm={(resolutionNotes) =>
          closeTarget &&
          closeMutation.mutate({ id: closeTarget.id, action: closeTarget.action, resolutionNotes })
        }
        isSubmitting={closeMutation.isPending}
      />
    </>
  );
}
