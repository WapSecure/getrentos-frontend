'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle } from '@sureground/icons';
import {
  Button,
  CardSkeleton,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
} from '@sureground/ui';
import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import {
  NoOfficeMessages,
  OfficeConversation,
} from '@/components/estate/messages/OfficeConversation';
import { RecordAvatar } from '@/components/shared/records/RecordParts';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { estateService } from '@/services/estateService';
import type { EstateResidentThreadSummary } from '@/types/estate';

const REFRESH_MS = 30_000;

export default function EstateResidentMessagesPage() {
  const queryClient = useQueryClient();
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const estateId = estate?.id ?? '';

  const threadsQuery = useQuery({
    queryKey: estateKeys.residentMessages(estateId),
    queryFn: () => unwrap(estateService.listResidentThreads(estateId)),
    enabled: !!estate,
    refetchInterval: REFRESH_MS,
  });
  const threads = threadsQuery.data ?? [];
  const activeSummary = threads.find((thread) => thread.id === activeId) ?? null;

  const threadQuery = useQuery({
    queryKey: estateKeys.residentMessageThread(estateId, activeId ?? ''),
    queryFn: async () => {
      const thread = await unwrap(estateService.getResidentThread(estateId, activeId!));
      // Opening a thread marks it read, so the list's unread dot has to refresh.
      void queryClient.invalidateQueries({
        queryKey: estateKeys.residentMessages(estateId),
        exact: true,
      });
      return thread;
    },
    enabled: !!estate && !!activeId,
    refetchInterval: REFRESH_MS,
  });

  if (isEstateLoading) return <CardSkeleton />;
  if (!estate) return <RedirectToEstateSetup />;

  const handleSend = async (body: string) => {
    if (!activeId) return false;
    const response = await estateService.replyToResident(estate.id, activeId, body);
    if (!response.success) return false;
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: estateKeys.residentMessageThread(estate.id, activeId),
      }),
      queryClient.invalidateQueries({
        queryKey: estateKeys.residentMessages(estate.id),
        exact: true,
      }),
    ]);
    return true;
  };

  const thread = threadQuery.data;
  const title = thread?.unitLabel ?? activeSummary?.unitLabel ?? '';
  const residentName = thread?.residentName ?? activeSummary?.residentName;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Resident messages"
        description={`Questions and requests from households in ${estate.name}. Replies are sent as the estate office.`}
      />

      {threadsQuery.isError && !threadsQuery.data ? (
        <PageErrorState
          title="Couldn’t load resident messages"
          error={threadsQuery.error}
          onRetry={() => void threadsQuery.refetch()}
          isRetrying={threadsQuery.isFetching}
          headingLevel="h2"
        />
      ) : (
        <div className="flex min-h-0 flex-1 gap-4">
          <div
            className={cn(
              activeId ? 'hidden sm:flex' : 'flex',
              'w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card sm:w-80'
            )}
          >
            {threadsQuery.isLoading ? (
              <ListSkeleton rows={4} />
            ) : threads.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No messages yet"
                description="When a resident writes to the estate office, their household’s conversation appears here."
                size="compact"
                bare
              />
            ) : (
              <ul className="flex-1 divide-y divide-border overflow-y-auto">
                {threads.map((summary) => (
                  <li key={summary.id}>
                    <ThreadRow
                      summary={summary}
                      active={summary.id === activeId}
                      onSelect={() => setActiveId(summary.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={cn(activeId ? 'flex' : 'hidden sm:flex', 'min-h-0 flex-1 flex-col')}>
            {activeId ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-2 self-start sm:hidden"
                  icon={<ArrowLeft className="h-4 w-4" />}
                  onClick={() => setActiveId(null)}
                >
                  Back to households
                </Button>
                {threadQuery.isError && !thread ? (
                  <PageErrorState
                    title="Couldn’t load this conversation"
                    error={threadQuery.error}
                    onRetry={() => void threadQuery.refetch()}
                    isRetrying={threadQuery.isFetching}
                    headingLevel="h2"
                  />
                ) : threadQuery.isLoading ? (
                  <ListSkeleton rows={3} />
                ) : (
                  <OfficeConversation
                    title={title}
                    subtitle={residentName}
                    messages={thread?.messages ?? []}
                    viewer="office"
                    onSend={handleSend}
                    placeholder="Reply to this household..."
                    emptyState={
                      <NoOfficeMessages
                        title="No messages yet"
                        description="This household hasn’t written anything yet."
                      />
                    }
                  />
                )}
              </>
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="Select a household to read their messages"
                className="flex-1"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadRow({
  summary,
  active,
  onSelect,
}: {
  summary: EstateResidentThreadSummary;
  active: boolean;
  onSelect: () => void;
}) {
  const preview = summary.lastMessagePreview
    ? `${summary.lastFromOffice ? 'You: ' : ''}${summary.lastMessagePreview}`
    : 'No messages yet';
  return (
    <button
      type="button"
      aria-current={active || undefined}
      onClick={onSelect}
      className={cn(
        'relative flex w-full cursor-pointer items-start gap-3 px-3 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        active
          ? 'bg-primary/[0.06] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
          : 'hover:bg-secondary/70'
      )}
    >
      <RecordAvatar name={summary.residentName ?? summary.unitLabel} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm text-foreground',
              summary.unread ? 'font-semibold' : 'font-medium'
            )}
          >
            {summary.unitLabel}
          </p>
          <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {formatRelativeTime(summary.lastMessageAt)}
          </span>
        </div>
        {summary.residentName && (
          <p className="truncate text-xs text-muted-foreground">{summary.residentName}</p>
        )}
        <p
          className={cn(
            'mt-0.5 truncate text-xs',
            summary.unread ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {preview}
        </p>
      </div>
      {summary.unread && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary">
          <span className="sr-only">Unread</span>
        </span>
      )}
    </button>
  );
}
