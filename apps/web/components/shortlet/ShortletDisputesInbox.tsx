'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Skeleton,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { Gavel, Send } from 'lucide-react';
import { cn } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/format';
import type { ShortletDisputeStatus } from '@/types/shortlet';

const STATUS_VARIANT: Record<ShortletDisputeStatus, BadgeVariant> = {
  OPEN: 'danger',
  UNDER_REVIEW: 'info',
  ESCALATED: 'warning',
  RESOLVED: 'success',
};

/**
 * Shortlet disputes: lists the disputes the current user raised or is the
 * subject of, with a thread view to discuss and let admins resolve.
 */
export function ShortletDisputesInbox() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: shortletKeys.disputes,
    queryFn: () => unwrap(shortletService.myDisputes({ page: 1, pageSize: 50 })),
  });
  const disputes = data?.items ?? [];

  const active = disputes.find((d) => d.id === activeId) ?? null;

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['shortlets', 'disputes', activeId, 'messages'],
    queryFn: () => unwrap(shortletService.disputeMessages(activeId!)),
    enabled: Boolean(activeId),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeId]);

  const send = useMutation({
    mutationFn: (text: string) => unwrap(shortletService.sendDisputeMessage(activeId!, text)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlets', 'disputes', activeId, 'messages'] });
      setDraft('');
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <div className="grid h-[70vh] grid-cols-1 gap-4 sm:grid-cols-[280px_1fr]">
      {/* Dispute list */}
      <div className="overflow-y-auto rounded-lg border border-border">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="No disputes"
            description="Disputes you raise or are involved in appear here."
          />
        ) : (
          <div className="divide-y divide-border">
            {disputes.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveId(d.id)}
                className={cn(
                  'w-full p-3 text-left transition-colors hover:bg-secondary',
                  activeId === d.id && 'bg-secondary'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <Badge variant={STATUS_VARIANT[d.status]}>{d.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {d.listingTitle ?? 'Shortlet'} · {d.raisedBy} → {d.against}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(d.createdAt, 'short')}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thread */}
      <div className="flex min-h-0 flex-col rounded-lg border border-border">
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Select a dispute to view its discussion.
          </div>
        ) : (
          <>
            <div className="border-b border-border p-3">
              <p className="font-medium">{active.title}</p>
              <p className="text-xs text-muted-foreground">
                {active.listingTitle} · {active.category.replace('_', ' ').toLowerCase()} ·{' '}
                {formatDate(active.createdAt, 'short')}
              </p>
              {active.resolution && (
                <p className="mt-1 rounded bg-success/10 px-2 py-1 text-xs text-success">
                  Resolution: {active.resolution}
                </p>
              )}
            </div>
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              <p className="rounded-lg bg-muted p-2 text-sm text-muted-foreground">
                {active.description}
              </p>
              {messagesLoading ? (
                <Skeleton className="h-16 w-full rounded-lg" />
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                      m.senderName === active.raisedBy
                        ? 'ml-auto bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-xs opacity-70">{m.senderName}</p>
                    <p>{m.text}</p>
                  </div>
                ))
              )}
            </div>
            {active.status !== 'RESOLVED' && (
              <div className="flex gap-2 border-t border-border p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && draft.trim() && !send.isPending) {
                      send.mutate(draft.trim());
                    }
                  }}
                  placeholder="Add a message…"
                />
                <Button
                  size="sm"
                  onClick={() => draft.trim() && send.mutate(draft.trim())}
                  disabled={!draft.trim() || send.isPending}
                >
                  <Send className="mr-1 h-3.5 w-3.5" /> Send
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
