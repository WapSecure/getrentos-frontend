'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus } from 'lucide-react';
import { Button, EmptyState, Pagination } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { InviteGatemanModal } from '@/components/estate/staff/InviteGatemanModal';
import { StaffMemberRow } from '@/components/estate/staff/StaffMemberRow';

const PAGE_SIZE = 10;

export default function EstateStaffPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data, isLoading: isStaffLoading } = useQuery({
    queryKey: [...estateKeys.staff(estate?.id ?? ''), { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(estateService.listStaff(estate!.id, { page, pageSize: PAGE_SIZE })),
    enabled: !!estate,
  });
  const staff = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidateStaff = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.staff(estate.id) });
  };

  const inviteGateman = useMutation({
    mutationFn: (email: string) => unwrap(estateService.inviteGateman(estate!.id, email)),
    onSuccess: () => {
      invalidateStaff();
      setPage(1);
      setIsModalOpen(false);
    },
  });

  const removeGateman = useMutation({
    mutationFn: (userId: string) => unwrap(estateService.removeGateman(estate!.id, userId)),
    onSuccess: () => {
      invalidateStaff();
      setPage((current) => (current > 1 && staff.length === 1 ? current - 1 : current));
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
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-muted-foreground mt-1">
            {total} gateman{total === 1 ? '' : 'men'} at {estate.name}
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            inviteGateman.reset();
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Gateman
        </Button>
      </div>

      {isStaffLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : staff.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={ShieldCheck}
            title="No gatemen yet"
            description="Add an existing platform account as a gateman so they can verify visitor passes."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {staff.map((member) => (
            <StaffMemberRow
              key={member.userId}
              member={member}
              onRemove={() => removeGateman.mutate(member.userId)}
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

      <InviteGatemanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(email) => inviteGateman.mutate(email)}
        isSubmitting={inviteGateman.isPending}
        error={inviteGateman.error instanceof Error ? inviteGateman.error.message : null}
      />
    </>
  );
}
