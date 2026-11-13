'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus } from '@sureground/icons';
import {
  Button,
  CardSkeleton,
  EmptyState,
  Pagination,
  ToggleChip,
  PageHeader,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { IssueVisitorPassModal } from '@/components/estate/visitor-passes/IssueVisitorPassModal';
import { VisitorPassRow } from '@/components/estate/visitor-passes/VisitorPassRow';
import { VisitorPinDialog } from '@/components/estate/visitor-passes/VisitorPinDialog';
import {
  EstateFilterChips,
  EstateListSection,
  EstateListSkeleton,
  EstateRowList,
} from '@/components/estate/shared/EstateListSection';
import type { IssuedVisitorPass, VisitorPassStatus } from '@/types/estate';

const statusFilters: { value: VisitorPassStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_approval', label: 'Awaiting approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'denied', label: 'Refused' },
];

const PAGE_SIZE = 10;
const HOUSEHOLD_OPTIONS_PAGE_SIZE = 20;

export default function EstateVisitorPassesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VisitorPassStatus | 'all'>('all');
  const [issuedPass, setIssuedPass] = useState<IssuedVisitorPass | null>(null);
  const [page, setPage] = useState(1);
  const [householdPage, setHouseholdPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data: householdsData, isLoading: isHouseholdsLoading } = useQuery({
    queryKey: [
      ...estateKeys.households(estate?.id ?? ''),
      {
        page: householdPage,
        pageSize: HOUSEHOLD_OPTIONS_PAGE_SIZE,
        status: 'active',
        purpose: 'visitor-pass-options',
      },
    ],
    queryFn: () =>
      unwrap(
        estateService.listHouseholds(estate!.id, {
          page: householdPage,
          pageSize: HOUSEHOLD_OPTIONS_PAGE_SIZE,
          status: 'active',
        })
      ),
    enabled: !!estate,
    placeholderData: keepPreviousData,
  });
  const households = householdsData?.items ?? [];
  const householdsTotal = householdsData?.total ?? 0;

  const { data, isLoading: isPassesLoading } = useQuery({
    queryKey: [
      ...estateKeys.visitorPasses(
        estate?.id ?? '',
        statusFilter === 'all' ? undefined : statusFilter
      ),
      { page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        estateService.listVisitorPasses(estate!.id, {
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
        })
      ),
    enabled: !!estate,
    placeholderData: keepPreviousData,
  });
  const passes = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidatePasses = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'visitorPasses'] });
  };

  const issuePass = useMutation({
    mutationFn: (data: Parameters<typeof estateService.issueVisitorPass>[1]) =>
      unwrap(estateService.issueVisitorPass(estate!.id, data)),
    onSuccess: (result) => {
      invalidatePasses();
      setPage(1);
      setIsModalOpen(false);
      setIssuedPass(result);
    },
  });

  const revokePass = useMutation({
    mutationFn: (passId: string) => unwrap(estateService.revokeVisitorPass(estate!.id, passId)),
    onSuccess: () => {
      invalidatePasses();
      setPage(1);
    },
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  const activeFilter = statusFilters.find((filter) => filter.value === statusFilter)!;
  const openIssue = () => {
    setHouseholdPage(1);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Visitor passes"
        description={`Passes issued for visitors to ${estate.name}. Each visitor shows their PIN at the gate.`}
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openIssue}>
            Issue pass
          </Button>
        }
      />

      <EstateListSection
        id="visitor-passes"
        title={statusFilter === 'all' ? 'All passes' : activeFilter.label}
        count={isPassesLoading ? undefined : total}
        countLabel={`${total} pass${total === 1 ? '' : 'es'}`}
        description="Who each pass is for, the home they are visiting and when it runs out. A pass can be revoked while it is pending."
        toolbar={
          <EstateFilterChips label="Filter passes by status">
            {statusFilters.map((filter) => (
              <ToggleChip
                key={filter.value}
                size="sm"
                pressed={statusFilter === filter.value}
                onPressedChange={() => {
                  setStatusFilter(filter.value);
                  setPage(1);
                }}
              >
                {filter.label}
              </ToggleChip>
            ))}
          </EstateFilterChips>
        }
        footer={
          total > PAGE_SIZE ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : undefined
        }
      >
        {isPassesLoading ? (
          <EstateListSkeleton />
        ) : passes.length === 0 ? (
          statusFilter === 'all' ? (
            <EmptyState
              bare
              icon={KeyRound}
              title="No visitor passes yet"
              description="Issue a pass so a visitor can be verified at the gate. Passes residents issue show up here too."
              action={
                <Button variant="outline" size="sm" onClick={openIssue}>
                  Issue the first pass
                </Button>
              }
            />
          ) : (
            <EmptyState
              bare
              size="compact"
              icon={KeyRound}
              title={`No passes are ${activeFilter.label.toLowerCase()}`}
              description="Try another status, or show every pass."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setPage(1);
                  }}
                >
                  Show all passes
                </Button>
              }
            />
          )
        ) : (
          <EstateRowList>
            {passes.map((pass) => (
              <li key={pass.id}>
                <VisitorPassRow
                  pass={pass}
                  estateId={estate.id}
                  onRevoke={() => revokePass.mutate(pass.id)}
                  isRevoking={revokePass.isPending}
                />
              </li>
            ))}
          </EstateRowList>
        )}
      </EstateListSection>

      <IssueVisitorPassModal
        isOpen={isModalOpen}
        households={households}
        householdTotal={householdsTotal}
        householdPage={householdPage}
        householdPageSize={HOUSEHOLD_OPTIONS_PAGE_SIZE}
        onHouseholdPageChange={setHouseholdPage}
        isHouseholdsLoading={isHouseholdsLoading}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => issuePass.mutate(data)}
        isSubmitting={issuePass.isPending}
      />

      <VisitorPinDialog pass={issuedPass} onClose={() => setIssuedPass(null)} />
    </>
  );
}
