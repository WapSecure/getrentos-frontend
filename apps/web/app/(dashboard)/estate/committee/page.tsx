'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, Select } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import type { CommitteeTitle } from '@/types/estate';

const titleOptions: { value: CommitteeTitle; label: string }[] = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'member', label: 'Member' },
];

const titleLabel: Record<CommitteeTitle, string> = {
  president: 'President',
  vice_president: 'Vice President',
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [householdId, setHouseholdId] = useState('');
  const [title, setTitle] = useState<CommitteeTitle>('member');

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
    onSuccess: invalidateCommittee,
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Committee</h1>
        <p className="text-muted-foreground mt-1">
          The board running {estate.name} — appoint households to a seat and title.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-3">Appoint a household</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            value={householdId}
            onValueChange={setHouseholdId}
            options={availableHouseholds.map((h) => ({
              value: h.id,
              label: `${h.unitLabel} — ${h.residentName}`,
            }))}
            placeholder="Select a household"
          />
          <Select
            value={title}
            onValueChange={(value) => setTitle(value as CommitteeTitle)}
            options={titleOptions}
          />
        </div>
        <Button
          variant="primary"
          className="gap-2 mt-3"
          disabled={!householdId || appointMember.isPending}
          onClick={() => appointMember.mutate()}
        >
          {appointMember.isPending ? 'Appointing…' : 'Appoint'}
        </Button>
      </div>

      {isMembersLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
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
                <button
                  onClick={() => removeMember.mutate(member.id)}
                  disabled={removeMember.isPending}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                  aria-label={`Remove ${member.residentName} from the committee`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
