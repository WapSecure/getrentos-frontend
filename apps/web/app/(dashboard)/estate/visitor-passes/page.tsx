'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus } from 'lucide-react';
import { Button, EmptyState, Pagination } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { IssueVisitorPassModal } from '@/components/estate/visitor-passes/IssueVisitorPassModal';
import { VisitorPassRow } from '@/components/estate/visitor-passes/VisitorPassRow';
import { VisitorPinDialog } from '@/components/estate/visitor-passes/VisitorPinDialog';
import type { IssuedVisitorPass, VisitorPassStatus } from '@/types/estate';

const statusFilters: { value: VisitorPassStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
];

const PAGE_SIZE = 10;
const HOUSEHOLD_OPTIONS_PAGE_SIZE = 20;

export default function EstateVisitorPassesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VisitorPassStatus | 'all'>('all');
  const [issuedPass, setIssuedPass] = useState<IssuedVisitorPass | null>(null);
  const [page, setPage] = useState(1);
  const [householdPage, setHouseholdPage] = useState(1);

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

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
          <h1 className="text-2xl font-bold text-foreground">Visitor Passes</h1>
          <p className="text-muted-foreground mt-1">
            {total} pass{total === 1 ? '' : 'es'} in {estate.name}
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            setHouseholdPage(1);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Issue Pass
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isPassesLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : passes.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={KeyRound}
            title="No visitor passes yet"
            description="Issue a pass so a visitor can be verified at the gate."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {passes.map((pass) => (
            <VisitorPassRow
              key={pass.id}
              pass={pass}
              onRevoke={() => revokePass.mutate(pass.id)}
              isRevoking={revokePass.isPending}
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
