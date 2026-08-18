'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { InviteGatemanModal } from '@/components/estate/staff/InviteGatemanModal';
import { StaffMemberRow } from '@/components/estate/staff/StaffMemberRow';

export default function EstateStaffPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data: staff = [], isLoading: isStaffLoading } = useQuery({
    queryKey: estateKeys.staff(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listStaff(estate!.id)),
    enabled: !!estate,
  });

  const invalidateStaff = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.staff(estate.id) });
  };

  const inviteGateman = useMutation({
    mutationFn: (email: string) => unwrap(estateService.inviteGateman(estate!.id, email)),
    onSuccess: () => {
      invalidateStaff();
      setIsModalOpen(false);
    },
  });

  const removeGateman = useMutation({
    mutationFn: (userId: string) => unwrap(estateService.removeGateman(estate!.id, userId)),
    onSuccess: invalidateStaff,
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
            {staff.length} gateman{staff.length === 1 ? '' : 'men'} at {estate.name}
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
