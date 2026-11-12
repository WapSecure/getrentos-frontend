'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert, Plus } from '@sureground/icons';
import { Button, CardSkeleton, EmptyState, ToggleChip, PageHeader } from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { ReportViolationModal } from '@/components/estate/violations/ReportViolationModal';
import { CloseViolationModal } from '@/components/estate/violations/CloseViolationModal';
import { ViolationCard } from '@/components/estate/violations/ViolationCard';
import type { ViolationStatus } from '@/types/estate';
import {
  EstateFilterChips,
  EstateListSection,
  EstateListSkeleton,
  EstateRowList,
} from '@/components/estate/shared/EstateListSection';

const statusFilters: { value: ViolationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reported', label: 'Reported' },
  { value: 'warning_issued', label: 'Warning issued' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function EstateViolationsPage() {
  const queryClient = useQueryClient();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ViolationStatus | 'all'>('all');
  const [closeTarget, setCloseTarget] = useState<{
    id: string;
    action: 'resolve' | 'dismiss';
  } | null>(null);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data: householdsData } = useQuery({
    queryKey: estateKeys.households(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listHouseholds(estate!.id, { page: 1, pageSize: 100 })),
    enabled: !!estate,
  });
  const households = householdsData?.items ?? [];

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
    placeholderData: keepPreviousData,
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
    meta: { showGlobalError: true },
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
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  const activeFilter = statusFilters.find((filter) => filter.value === statusFilter)!;

  return (
    <>
      <PageHeader
        title="Violations"
        description={`Estate rule breaches reported against households in ${estate.name}.`}
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsReportOpen(true)}
          >
            Report violation
          </Button>
        }
      />

      <EstateListSection
        id="violations"
        title={statusFilter === 'all' ? 'All violations' : activeFilter.label}
        count={isViolationsLoading ? undefined : violations.length}
        countLabel={`${violations.length} violation${violations.length === 1 ? '' : 's'}`}
        description="Issue a warning, then resolve or dismiss each one with an optional note."
        toolbar={
          <EstateFilterChips label="Filter violations by status">
            {statusFilters.map((filter) => (
              <ToggleChip
                key={filter.value}
                size="sm"
                pressed={statusFilter === filter.value}
                onPressedChange={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </ToggleChip>
            ))}
          </EstateFilterChips>
        }
      >
        {isViolationsLoading ? (
          <EstateListSkeleton />
        ) : violations.length === 0 ? (
          statusFilter === 'all' ? (
            <EmptyState
              bare
              icon={TriangleAlert}
              title="No violations reported"
              description="Report a household rule violation to start tracking it here."
            />
          ) : (
            <EmptyState
              bare
              size="compact"
              icon={TriangleAlert}
              title={`No violations marked ${activeFilter.label.toLowerCase()}`}
              description="Try another status, or show every violation."
              action={
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                  Show all violations
                </Button>
              }
            />
          )
        ) : (
          <EstateRowList>
            {violations.map((violation) => (
              <li key={violation.id}>
                <ViolationCard
                  violation={violation}
                  onWarn={() => warnMutation.mutate(violation.id)}
                  onResolve={() => setCloseTarget({ id: violation.id, action: 'resolve' })}
                  onDismiss={() => setCloseTarget({ id: violation.id, action: 'dismiss' })}
                  isUpdating={warnMutation.isPending || closeMutation.isPending}
                />
              </li>
            ))}
          </EstateRowList>
        )}
      </EstateListSection>

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
