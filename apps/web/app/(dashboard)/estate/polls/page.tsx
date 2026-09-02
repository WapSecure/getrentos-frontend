'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Vote, Plus } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { CreatePollModal } from '@/components/estate/polls/CreatePollModal';
import { PollCard } from '@/components/estate/polls/PollCard';

export default function EstatePollsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data: polls = [], isLoading: isPollsLoading } = useQuery({
    queryKey: estateKeys.polls(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listPolls(estate!.id)),
    enabled: !!estate,
  });

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.polls(estate.id) });
  };

  const createPoll = useMutation({
    mutationFn: (data: Parameters<typeof estateService.createPoll>[1]) =>
      unwrap(estateService.createPoll(estate!.id, data)),
    onSuccess: () => {
      invalidate();
      setIsCreateOpen(false);
    },
  });

  const closePoll = useMutation({
    mutationFn: (pollId: string) => unwrap(estateService.closePoll(estate!.id, pollId)),
    onSuccess: invalidate,
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
          <h1 className="text-2xl font-bold text-foreground">Polls</h1>
          <p className="text-muted-foreground mt-1">
            {polls.length} poll{polls.length === 1 ? '' : 's'} in {estate.name}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New Poll
        </Button>
      </div>

      {isPollsLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : polls.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Vote}
            title="No polls yet"
            description="Ask residents for their opinion on estate decisions."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onClose={() => closePoll.mutate(poll.id)}
              isUpdating={closePoll.isPending}
            />
          ))}
        </div>
      )}

      <CreatePollModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => createPoll.mutate(data)}
        isSubmitting={createPoll.isPending}
      />
    </>
  );
}
