'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LifeBuoy, MessageCircle, Send } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { renterService } from '@/services/renterService';
import { renterKeys } from '@/lib/queryKeys';
import { useRealtimeEvent } from '@/hooks/useRealtime';
import type { SupportThread } from '@/types/support';

const CATEGORIES = [
  { value: 'payments', label: 'Payments & rent' },
  { value: 'property', label: 'Property & maintenance' },
  { value: 'account', label: 'Account & verification' },
  { value: 'lease', label: 'Lease & tenancy' },
  { value: 'other', label: 'Something else' },
];

const fmt = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

export const RenterSupportPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('payments');
  const [draft, setDraft] = useState('');

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['renter', 'support'] });
  };
  useRealtimeEvent('support:update', invalidateAll);

  const { data: threads = [] } = useQuery({
    queryKey: renterKeys.supportThreads,
    queryFn: () => unwrap(renterService.listSupportThreads()),
  });

  const activeThread = useMemo(
    () =>
      threads.find((t) => t.id === selectedId) ??
      threads.find((t) => t.status === 'OPEN') ??
      threads[0] ??
      null,
    [threads, selectedId]
  );

  const { data: messages = [] } = useQuery({
    queryKey: renterKeys.supportMessages(activeThread?.id ?? ''),
    queryFn: () => unwrap(renterService.getSupportThreadMessages(activeThread!.id)),
    enabled: !!activeThread,
  });

  const createThread = useMutation({
    mutationFn: () => renterService.createSupportThread({ subject: subject.trim(), category }),
    onSuccess: (res) => {
      const thread = res.data as SupportThread | undefined;
      if (thread) {
        setSelectedId(thread.id);
        setComposing(false);
        setSubject('');
      }
      invalidateAll();
    },
  });

  const sendMessage = useMutation({
    mutationFn: (text: string) => renterService.sendSupportMessage(activeThread!.id, text),
    onSuccess: () => {
      setDraft('');
      invalidateAll();
    },
  });

  const resolveThread = useMutation({
    mutationFn: () => renterService.resolveSupportThread(activeThread!.id),
    onSuccess: invalidateAll,
  });

  const canSend = activeThread && draft.trim().length > 0 && !sendMessage.isPending;

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          <LifeBuoy className="h-3 w-3" />
          Support
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Contact support
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Chat with the GetRentOS team. You get one active thread — resolving it closes it, and a
          new message opens it again.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Thread list */}
        <aside className="space-y-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">My conversations</p>
            <Button type="button" size="sm" variant="outline" onClick={() => setComposing(true)}>
              <MessageCircle className="mr-1.5 h-4 w-4" />
              New
            </Button>
          </div>
          {threads.length === 0 ? (
            <p className="rounded-xl border border-border/80 bg-card p-4 text-sm text-muted-foreground">
              No support conversations yet — start one below.
            </p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedId(thread.id)}
                className={`w-full rounded-xl border bg-card p-3 text-left transition-colors ${
                  activeThread?.id === thread.id
                    ? 'border-primary/40 ring-1 ring-primary/20'
                    : 'border-border/80 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {thread.category ? thread.category : 'General'}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      thread.status === 'OPEN'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}
                  >
                    {thread.status === 'OPEN' ? 'Open' : 'Resolved'}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {thread.lastMessage ?? 'No messages yet'}
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{fmt(thread.lastMessageAt) || fmt(thread.createdAt)}</span>
                  {thread.unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {thread.unreadCount} new
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </aside>

        {/* Active thread / compose */}
        <section className="lg:col-span-3">
          {composing || !activeThread ? (
            <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
              {composing && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setComposing(false)}
                  className="mb-3"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
              )}
              <h2 className="text-base font-semibold text-foreground">Start a conversation</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Tell us what you need help with.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <textarea
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    rows={5}
                    placeholder="Describe the issue…"
                    className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => createThread.mutate()}
                  disabled={subject.trim().length < 3 || createThread.isPending}
                >
                  {createThread.isPending ? 'Sending…' : 'Send to support'}
                  <Send className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeThread.category ? activeThread.category : 'Support'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeThread.status === 'OPEN'
                      ? 'We usually reply within a few hours'
                      : 'This conversation is resolved'}
                  </p>
                </div>
                {activeThread.status === 'OPEN' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => resolveThread.mutate()}
                    disabled={resolveThread.isPending}
                  >
                    Mark resolved
                  </Button>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.senderType === 'contact' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.senderType === 'contact'
                          ? 'rounded-br-sm bg-primary text-primary-foreground'
                          : 'rounded-bl-sm bg-accent text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className="mt-1 text-right text-[10px] opacity-70">{fmt(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/80 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    placeholder={
                      activeThread.status === 'OPEN'
                        ? 'Write a reply…'
                        : 'Send a message to reopen this conversation'
                    }
                    className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (canSend) sendMessage.mutate(draft.trim());
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => canSend && sendMessage.mutate(draft.trim())}
                    disabled={!canSend}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-right text-[10px] text-muted-foreground">Enter to send</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
