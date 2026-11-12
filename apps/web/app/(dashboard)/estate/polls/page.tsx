'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Vote, Plus } from '@sureground/icons';
import { Button, CardSkeleton, EmptyState, PageHeader } from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { CreatePollModal } from '@/components/estate/polls/CreatePollModal';
import { PollCard } from '@/components/estate/polls/PollCard';
import {
  EstateListSection,
  EstateListSkeleton,
  EstateRowList,
} from '@/components/estate/shared/EstateListSection';

export default function EstatePollsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

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
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  const openCount = polls.filter((poll) => poll.status === 'open').length;

  return (
    <>
      <PageHeader
        title="Polls"
        description={`Ask the households in ${estate.name} to vote on a question.`}
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New poll
          </Button>
        }
      />

      <EstateListSection
        id="polls"
        title="All polls"
        count={isPollsLoading ? undefined : polls.length}
        countLabel={`${polls.length} poll${polls.length === 1 ? '' : 's'}`}
        description={
          isPollsLoading || polls.length === 0
            ? 'Results update as residents vote. Close a poll to stop voting.'
            : `${openCount} open. Results update as residents vote. Close a poll to stop voting.`
        }
      >
        {isPollsLoading ? (
          <EstateListSkeleton />
        ) : polls.length === 0 ? (
          <EmptyState
            bare
            icon={Vote}
            title="No polls yet"
            description="Ask residents for their opinion on estate decisions. Residents with a linked account vote from their own dashboard."
            action={
              <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
                Ask the first question
              </Button>
            }
          />
        ) : (
          <EstateRowList>
            {polls.map((poll) => (
              <li key={poll.id}>
                <PollCard
                  poll={poll}
                  onClose={() => closePoll.mutate(poll.id)}
                  isUpdating={closePoll.isPending}
                />
              </li>
            ))}
          </EstateRowList>
        )}
      </EstateListSection>

      <CreatePollModal
        estateId={estate?.id}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => createPoll.mutate(data)}
        isSubmitting={createPoll.isPending}
      />
    </>
  );
}
