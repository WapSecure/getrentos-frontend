'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Skeleton,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/format';
import type { ShortletConversation } from '@/types/shortlet';

/**
 * Guest <-> host message threads for shortlets. Renders a conversation list
 * on the left and the selected thread on the right; new messages are sent via
 * the role-appropriate endpoint and conversations refresh on send.
 */
export function ShortletMessagesInbox({ role }: { role: 'guest' | 'host' }) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const queryKey = role === 'guest' ? shortletKeys.guestMessages : shortletKeys.hostMessages;
  const listFn = role === 'guest' ? shortletService.myMessages : shortletService.hostMessages;
  const sendFn = role === 'guest' ? shortletService.sendMessage : shortletService.hostSendMessage;
  const markReadFn = role === 'guest' ? shortletService.markRead : shortletService.hostMarkRead;

  const { data, isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: () => unwrap(listFn({ page: 1, pageSize: 50 })),
  });
  const conversations = data?.items ?? [];
  const active = conversations.find((c) => c.id === activeId) ?? null;

  const openThread = (c: ShortletConversation) => {
    setActiveId(c.id);
    if (c.unreadCount > 0) {
      markReadFn(c.id).then(() => queryClient.invalidateQueries({ queryKey }));
    }
  };

  const send = useMutation({
    mutationFn: (text: string) => unwrap(sendFn(activeId!, text)),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey });
      setToast({ message: 'Message sent.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const submit = () => {
    if (!activeId || !draft.trim() || send.isPending) return;
    send.mutate(draft.trim());
  };

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded-xl border border-border">
      <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Conversation list */}
        <div className="border-b border-border md:border-b-0 md:border-r">
          <div className="border-b border-border p-3">
            <p className="flex items-center gap-2 font-medium">
              <MessageSquare className="h-4 w-4" /> Shortlet messages
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto md:max-h-none md:h-[calc(100%-49px)]">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={MessageSquare}
                  title="No messages yet"
                  description="Message a host from a listing to start a conversation."
                />
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openThread(c)}
                  className={cn(
                    'flex w-full items-start gap-2 border-b border-border p-3 text-left transition hover:bg-secondary/40',
                    activeId === c.id && 'bg-secondary/60'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.propertyName}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {c.unreadCount > 0 && (
                      <Badge variant="info" className="h-4 min-w-4 px-1 text-[10px]">
                        {c.unreadCount}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(c.lastMessageAt, 'short')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-0 flex-col">
          {active ? (
            <>
              <div className="border-b border-border p-3">
                <p className="font-medium">{active.propertyName}</p>
                <p className="text-xs text-muted-foreground">
                  {active.participantRole === 'host' ? 'Host' : 'Guest'} · {active.participantName}
                </p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {active.messages.map((m) => {
                  const mine = m.senderId !== active.participantId;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                        mine
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-secondary/70 text-foreground'
                      )}
                    >
                      <p className="break-words">{m.text}</p>
                      <p
                        className={cn(
                          'mt-0.5 text-[10px]',
                          mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}
                      >
                        {m.senderName} · {formatDate(m.timestamp, 'short')}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <Input
                  placeholder="Write a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                />
                <Button onClick={submit} disabled={!draft.trim() || send.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <p className="text-sm text-muted-foreground">
                Select a conversation to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
