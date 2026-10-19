'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, MessageSquareText } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';

import {
  adminOwnerQueryService,
  type AdminQuerySummary,
  type QueryStatus,
} from '@/services/adminOwnerQueryService';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';

const lagos = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const slaText = (q: AdminQuerySummary) => {
  if (q.firstResponseAt) {
    const h = q.answeredInHours ?? 0;
    return `${q.late ? 'Answered late' : 'Answered'} in ${h < 1 ? 'under an hour' : `${h}h`}`;
  }
  return q.late ? 'Overdue: no reply yet' : `Reply due by ${lagos(q.firstResponseDueAt)}`;
};

const STATUS: Record<QueryStatus, { label: string; variant: 'warning' | 'info' | 'neutral' }> = {
  OPEN: { label: 'Waiting on us', variant: 'warning' },
  ANSWERED: { label: 'Answered', variant: 'info' },
  RESOLVED: { label: 'Resolved', variant: 'neutral' },
};

const Thread = ({
  id,
  canOperate,
  onBack,
}: {
  id: string;
  canOperate: boolean;
  onBack: () => void;
}) => {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const thread = useQuery({
    queryKey: ['admin', 'owner-queries', id],
    queryFn: () => unwrap(adminOwnerQueryService.get(id)),
  });
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: ['admin', 'owner-queries'] });
  const send = useMutation({
    mutationFn: () => unwrap(adminOwnerQueryService.reply(id, reply.trim())),
    onSuccess: () => {
      setReply('');
      setError(null);
      refresh();
    },
    onError: (err: Error) => setError(err.message),
  });
  const resolve = useMutation({
    mutationFn: () => unwrap(adminOwnerQueryService.resolve(id)),
    onSuccess: refresh,
    onError: (err: Error) => setError(err.message),
  });
  const q = thread.data;
  if (!q) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All questions
      </button>
      <Card className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{q.subject}</h2>
            <p className="text-sm text-muted-foreground">
              {q.propertyTitle} · from {q.ownerName ?? 'the owner'}
            </p>
            <p
              className={`mt-1 flex items-center gap-1 text-sm ${q.late ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden /> {slaText(q)}
            </p>
          </div>
          <Badge variant={STATUS[q.status].variant}>{STATUS[q.status].label}</Badge>
        </div>
        <ol className="space-y-3">
          {q.messages.map((m) => (
            <li
              key={m.id}
              className={`flex ${m.side === 'MANAGER' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.side === 'MANAGER' ? 'bg-primary/10' : 'bg-muted'}`}
              >
                <p className="whitespace-pre-wrap text-foreground">{m.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.author}
                  {m.onBehalfOf && <> for {m.onBehalfOf}</>} · {lagos(m.at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {canOperate && q.status !== 'RESOLVED' && (
          <div className="border-t border-border pt-4">
            <Textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to the owner"
            />
            <div className="mt-2 flex gap-2">
              <Button
                isLoading={send.isPending}
                disabled={reply.trim().length < 2}
                onClick={() => send.mutate()}
              >
                Send reply
              </Button>
              <Button
                variant="outline"
                isLoading={resolve.isPending}
                onClick={() => resolve.mutate()}
              >
                Mark resolved
              </Button>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </Card>
    </div>
  );
};

type Filter = 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'all';

export default function AdminOwnerQueriesPage() {
  const user = useAdminUser();
  const canOperate = hasAdminPermission(user?.roles, 'managed.operate');
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ['admin', 'owner-queries', 'list', filter],
    queryFn: () => unwrap(adminOwnerQueryService.list(filter === 'all' ? undefined : filter)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <MessageSquareText className="h-6 w-6 text-primary" aria-hidden />
          Owner questions
        </h1>
        <p className="mt-1 text-muted-foreground">
          Questions from owners on GetRentos Managed properties. A first reply is owed within 24
          hours; overdue ones are flagged and the owner can see it.
        </p>
      </div>
      {openId ? (
        <Thread id={openId} canOperate={canOperate} onBack={() => setOpenId(null)} />
      ) : (
        <>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="OPEN">Waiting on us</TabsTrigger>
              <TabsTrigger value="ANSWERED">Answered</TabsTrigger>
              <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          {list.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (list.data ?? []).length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="Nothing here"
              description="Owner questions appear here as they come in."
            />
          ) : (
            <Card className="divide-y divide-border">
              {(list.data ?? []).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setOpenId(q.id)}
                  className="flex w-full flex-col gap-1 p-4 text-left hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{q.subject}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {q.propertyTitle} · {q.ownerName ?? 'Owner'}
                      {q.lastMessage && <> · {q.lastMessage.preview}</>}
                    </p>
                    <p
                      className={`text-xs ${q.late ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      {slaText(q)}
                    </p>
                  </div>
                  <Badge variant={STATUS[q.status].variant}>{STATUS[q.status].label}</Badge>
                </button>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
