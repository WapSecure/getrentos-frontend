'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark, Trash2 } from '@sureground/icons';
import {
  Badge,
  Button,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  IconButton,
  ListSkeleton,
  Select,
  PageHeader,
  useToast,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import type { CommitteeTitle } from '@/types/estate';

const titleOptions: { value: CommitteeTitle; label: string }[] = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice president' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'member', label: 'Member' },
];

const titleLabel: Record<CommitteeTitle, string> = {
  president: 'President',
  vice_president: 'Vice president',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  member: 'Member',
};

const titleVariant: Record<CommitteeTitle, 'info' | 'warning' | 'neutral'> = {
  president: 'info',
  vice_president: 'info',
  secretary: 'neutral',
  treasurer: 'warning',
  member: 'neutral',
};

export default function EstateCommitteePage() {
  const queryClient = useQueryClient();
  const [householdId, setHouseholdId] = useState('');
  const [title, setTitle] = useState<CommitteeTitle>('member');
  const [removing, setRemoving] = useState<{
    id: string;
    residentName: string;
    title: CommitteeTitle;
  } | null>(null);
  const toast = useToast();

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data: householdsData } = useQuery({
    queryKey: estateKeys.households(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listHouseholds(estate!.id, { page: 1, pageSize: 100 })),
    enabled: !!estate,
  });
  const households = householdsData?.items ?? [];

  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: estateKeys.committee(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listCommitteeMembers(estate!.id)),
    enabled: !!estate,
  });

  const invalidateCommittee = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.committee(estate.id) });
  };

  const appointedHouseholdIds = new Set((members ?? []).map((m) => m.householdId));
  const availableHouseholds = households.filter((h) => !appointedHouseholdIds.has(h.id));

  const appointMember = useMutation({
    mutationFn: () =>
      unwrap(estateService.appointCommitteeMember(estate!.id, { householdId, title })),
    onSuccess: () => {
      setHouseholdId('');
      setTitle('member');
      invalidateCommittee();
    },
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) =>
      unwrap(estateService.removeCommitteeMember(estate!.id, memberId)),
    onSuccess: () => {
      invalidateCommittee();
      if (removing) toast.success(`${removing.residentName} removed from the committee.`);
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to remove this member.'),
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  return (
    <>
      <PageHeader
        title="Committee"
        description={<>The board running {estate.name}: appoint households to a seat and title.</>}
      />

      <div className="bg-card rounded-2xl border border-border p-4 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-3">Appoint a household</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            value={householdId}
            onValueChange={setHouseholdId}
            options={availableHouseholds.map((h) => ({
              value: h.id,
              label: `${h.unitLabel}: ${h.residentName}`,
            }))}
            placeholder="Select a household"
            ariaLabel="Household"
            searchable
          />
          <Select
            value={title}
            onValueChange={(value) => setTitle(value as CommitteeTitle)}
            options={titleOptions}
            ariaLabel="Committee title"
          />
        </div>
        <Button
          variant="primary"
          className="mt-3"
          disabled={!householdId}
          isLoading={appointMember.isPending}
          loadingText="Appointing…"
          onClick={() => appointMember.mutate()}
        >
          Appoint
        </Button>
      </div>

      {isMembersLoading ? (
        <ListSkeleton rows={3} />
      ) : !members || members.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Landmark}
            title="No committee members yet"
            description="Appoint a household above to give them a seat on the board."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {member.residentName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{member.unitLabel}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={titleVariant[member.title]}>{titleLabel[member.title]}</Badge>
                <IconButton
                  label={`Remove ${member.residentName} from the committee`}
                  icon={<Trash2 />}
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setRemoving({
                      id: member.id,
                      residentName: member.residentName,
                      title: member.title,
                    })
                  }
                  disabled={removeMember.isPending}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Remove this committee member?"
        description={
          removing
            ? `${removing.residentName} loses their ${titleLabel[removing.title].toLowerCase()} seat on the committee. You can appoint their household again later.`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={() => removing && removeMember.mutateAsync(removing.id)}
        isLoading={removeMember.isPending}
      />
    </>
  );
}
