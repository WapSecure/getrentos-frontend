'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Skeleton } from '@getrentos/ui';
import { BadgeCheck, Clock3, FileCheck2, Plus, ScrollText } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { LandTitleEventInput } from '@/types/landDeveloper';
import { errorMessage, type Notify } from './feedback';
import { TITLE_EVENT_KIND_LABELS } from './labels';
import { TitleEventDialog } from './TitleEventDialog';

const kindLabel = (kind: string) =>
  TITLE_EVENT_KIND_LABELS[kind as keyof typeof TITLE_EVENT_KIND_LABELS] ??
  kind.toLowerCase().replace(/_/g, ' ');

/**
 * The parcel's chain of title, oldest first. Owners can add links; each stays
 * "unverified" until a reviewer confirms it, and only verified links count as
 * evidence in diligence.
 */
export const TitleHistorySection = ({
  propertyId,
  notify,
}: {
  propertyId: string;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const key = landDeveloperKeys.titleHistory(propertyId);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => unwrap(landDeveloperService.listTitleHistory(propertyId)),
  });

  const add = useMutation({
    mutationFn: (input: LandTitleEventInput) =>
      unwrap(landDeveloperService.addTitleEvent(propertyId, input)),
    onSuccess: (events) => {
      queryClient.setQueryData(key, events);
      queryClient.invalidateQueries({ queryKey: landDeveloperKeys.risk(propertyId) });
      queryClient.invalidateQueries({ queryKey: landDeveloperKeys.documents(propertyId) });
      setOpen(false);
      notify('Added to the chain of title. Compliance will verify it.');
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Chain of title
          </p>
          <h2 className="mt-1 font-semibold text-foreground">How this land came to you</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Record each grant, excision, assignment or consent back to the root of title. Buyers
            trust land whose history is complete and verified.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          rounded="lg"
          onClick={() => setOpen(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Add a link
        </Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : isError && !data ? (
          <p className="text-sm text-destructive">
            {errorMessage(error, 'The chain of title could not be loaded.')}
          </p>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <ScrollText className="h-5 w-5 shrink-0" aria-hidden="true" />
            No history recorded yet. Start with the earliest grant you hold papers for.
          </div>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {data.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className={`absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-card ${
                    event.verified ? 'bg-success' : 'bg-muted-foreground/50'
                  }`}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{kindLabel(event.kind)}</p>
                  {event.verified ? (
                    <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="neutral" icon={<Clock3 className="h-3.5 w-3.5" />}>
                      Unverified
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDate(event.occurredAt)}
                  {(event.fromParty || event.toParty) &&
                    ` · ${event.fromParty ?? '—'} to ${event.toParty ?? '—'}`}
                </p>
                {(event.instrumentReference || event.registeredAt) && (
                  <p className="text-xs text-muted-foreground">
                    {event.instrumentReference && `Reg. ${event.instrumentReference}`}
                    {event.instrumentReference && event.registeredAt && ' · '}
                    {event.registeredAt && `registered ${formatDate(event.registeredAt)}`}
                  </p>
                )}
                {event.note && (
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">{event.note}</p>
                )}
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  Recorded by {event.recordedByName}
                  {event.documentId && (
                    <span className="inline-flex items-center gap-1">
                      <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Document attached
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <TitleEventDialog
        propertyId={propertyId}
        open={open}
        onOpenChange={setOpen}
        isSaving={add.isPending}
        onSubmit={(input) => add.mutate(input)}
      />
    </section>
  );
};
