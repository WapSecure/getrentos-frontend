'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Vote } from 'lucide-react';
import { EmptyState } from '@getrentos/ui';
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Polls</h1>
        <p className="text-muted-foreground mt-1">Have your say on estate decisions</p>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : !polls || polls.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Vote}
            title="No polls yet"
            description="Nothing to vote on right now."
          />
        </div>
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
