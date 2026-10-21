'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, EmptyState, PageErrorState, Skeleton } from '@getrentos/ui';
import { Construction, Plus } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import {
  estateInfrastructureKeys,
  landEstateInfrastructureService,
} from '@/services/landEstateInfrastructureService';
import type {
  EstateChangeOrderInput,
  EstateCommitment,
  EstateCommitmentInput,
  EstateProgressInput,
} from '@/types/landEstateInfrastructure';
import { errorMessage, type Notify } from '../developer/feedback';
import { CommitmentCard } from './CommitmentCard';
import { ChangeOrderDialog, CommitmentFormDialog, ProgressDialog } from './CommitmentDialogs';

type Open =
  | { kind: 'create' }
  | { kind: 'progress'; commitment: EstateCommitment }
  | { kind: 'change'; commitment: EstateCommitment }
  | null;

/** The developer's estate promises: add them, report progress, ask buyers about changes. */
export const DeveloperEstateInfrastructure = ({
  propertyId,
  notify,
}: {
  propertyId: string;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const key = estateInfrastructureKeys.developer(propertyId);
  const list = useQuery({
    queryKey: key,
    queryFn: () => unwrap(landEstateInfrastructureService.forDeveloper(propertyId)),
  });
  const [open, setOpen] = useState<Open>(null);

  const saved = (next: EstateCommitment[], message: string) => {
    queryClient.setQueryData(key, next);
    setOpen(null);
    notify(message);
  };
  const fail = (error: unknown) => notify(errorMessage(error), 'error');

  const create = useMutation({
    mutationFn: (input: EstateCommitmentInput) =>
      unwrap(landEstateInfrastructureService.create(propertyId, input)),
    onSuccess: (next) => saved(next, 'Promise added. Buyers see it on the estate page.'),
    onError: fail,
  });
  const report = useMutation({
    mutationFn: (input: { commitmentId: string } & EstateProgressInput) => {
      const { commitmentId, ...body } = input;
      return unwrap(landEstateInfrastructureService.report(propertyId, commitmentId, body));
    },
    onSuccess: (next, input) =>
      saved(
        next,
        input.status === 'DELIVERED'
          ? 'Delivery reported. Buyers are told and GetRentos will check the evidence.'
          : 'Progress posted.'
      ),
    onError: fail,
  });
  const change = useMutation({
    mutationFn: (input: EstateChangeOrderInput) =>
      unwrap(landEstateInfrastructureService.proposeChange(propertyId, input)),
    onSuccess: (next, input) =>
      saved(
        next,
        next.find((c) => c.id === input.commitmentId)?.openChange
          ? 'Change sent. Buyers have 14 days to answer.'
          : 'No plot is sold yet, so the change applied at once.'
      ),
    onError: fail,
  });

  let body;
  if (list.isLoading) {
    body = <Skeleton className="h-40 rounded-2xl" />;
  } else if (list.isError) {
    body = (
      <PageErrorState
        title="Could not load the estate's promises"
        description={errorMessage(list.error)}
        onRetry={() => void list.refetch()}
        headingLevel="h2"
      />
    );
  } else if ((list.data ?? []).length === 0) {
    body = (
      <EmptyState
        icon={Construction}
        title="No infrastructure promises yet"
        description="List the roads, power, water and other works you will deliver. Buyers weigh these heavily, and verified delivery builds your estate's trust."
      />
    );
  } else {
    body = (
      <div className="grid gap-4 lg:grid-cols-2">
        {(list.data ?? []).map((commitment) => {
          const active = !commitment.withdrawn && commitment.status !== 'VERIFIED';
          const canReport =
            active && (commitment.status === 'PLANNED' || commitment.status === 'IN_PROGRESS');
          return (
            <CommitmentCard key={commitment.id} commitment={commitment}>
              {canReport && (
                <Button size="sm" onClick={() => setOpen({ kind: 'progress', commitment })}>
                  Post update
                </Button>
              )}
              {active && !commitment.openChange && commitment.status !== 'DELIVERED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpen({ kind: 'change', commitment })}
                >
                  Propose a change
                </Button>
              )}
            </CommitmentCard>
          );
        })}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Infrastructure</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What you promised to build, where each stands, and the evidence behind it.
          </p>
        </div>
        <Button
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setOpen({ kind: 'create' })}
        >
          Add promise
        </Button>
      </div>
      {body}

      {open?.kind === 'create' && (
        <CommitmentFormDialog
          open
          onOpenChange={(next) => !next && setOpen(null)}
          isSaving={create.isPending}
          onSubmit={(input) => create.mutate(input)}
        />
      )}
      {open?.kind === 'progress' && (
        <ProgressDialog
          open
          onOpenChange={(next) => !next && setOpen(null)}
          propertyId={propertyId}
          commitment={open.commitment}
          isSaving={report.isPending}
          onSubmit={(input) => report.mutate({ commitmentId: open.commitment.id, ...input })}
        />
      )}
      {open?.kind === 'change' && (
        <ChangeOrderDialog
          open
          onOpenChange={(next) => !next && setOpen(null)}
          commitment={open.commitment}
          isSaving={change.isPending}
          onSubmit={(input) => change.mutate(input)}
        />
      )}
    </section>
  );
};
