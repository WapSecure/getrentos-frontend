'use client';

import { useQuery } from '@tanstack/react-query';
import { Landmark } from '@sureground/icons';
import { Badge, EmptyState, ListSkeleton, PageHeader } from '@sureground/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import type { CommitteeTitle } from '@/types/estate';

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

export default function ResidentCommitteePage() {
  const { data: members, isLoading } = useQuery({
    queryKey: estateResidentKeys.committee,
    queryFn: () => unwrap(estateResidentService.listMyEstateCommittee()),
  });

  return (
    <>
      <PageHeader title="Committee" description={<>Who&apos;s on your estate&apos;s board</>} />

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !members || members.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No committee appointed yet"
          description="Once your estate manager appoints a board, they'll show up here."
        />
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
              <Badge variant={titleVariant[member.title]} className="shrink-0">
                {titleLabel[member.title]}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
