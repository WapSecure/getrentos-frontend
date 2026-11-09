'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Vote } from 'lucide-react';
import { EmptyState, ListSkeleton, PageHeader } from '@sureground/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { PollCard } from '@/components/estate/polls/PollCard';

export default function ResidentPollsPage() {
  const queryClient = useQueryClient();

  const { data: polls, isLoading } = useQuery({
    queryKey: estateResidentKeys.polls,
    queryFn: () => unwrap(estateResidentService.listMyPolls()),
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      unwrap(estateResidentService.voteOnPoll(pollId, optionId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estateResidentKeys.polls }),
  });

  return (
    <>
      <PageHeader title="Polls" description="Have your say on estate decisions" />

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !polls || polls.length === 0 ? (
        <EmptyState icon={Vote} title="No polls yet" description="Nothing to vote on right now." />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={(optionId) => voteMutation.mutate({ pollId: poll.id, optionId })}
              isUpdating={voteMutation.isPending}
            />
          ))}
        </div>
      )}
    </>
  );
}
