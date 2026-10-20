'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, MessageSquareText, Plus } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardSkeleton,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageErrorState,
  Select,
  Textarea,
} from '@getrentos/ui';

import { unwrap } from '@/lib/apiHelpers';
import { mine as myMandates } from '@/services/mandateService';
import {
  CATEGORY_LABEL,
  ownerQueryService,
  type QueryCategory,
  type QuerySummary,
} from '@/services/ownerQueryService';

const lagos = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/** How the reply promise stands, in words. */
const slaText = (q: QuerySummary) => {
  if (q.firstResponseAt) {
    const h = q.answeredInHours ?? 0;
    return `${q.late ? 'Answered late' : 'Answered'} in ${h < 1 ? 'under an hour' : `${h} hour${h === 1 ? '' : 's'}`}`;
  }
  if (q.late) return 'No reply yet: overdue';
  return `Reply due by ${lagos(q.firstResponseDueAt)}`;
};

/** The badge reads from the viewer's side: an open thread is waiting on the manager. */
const statusOf = (q: QuerySummary): { label: string; variant: 'warning' | 'info' | 'neutral' } => {
  if (q.status === 'RESOLVED') return { label: 'Resolved', variant: 'neutral' };
  if (q.status === 'ANSWERED') {
    return {
      label: q.viewerSide === 'OWNER' ? 'Answered' : 'Waiting on the owner',
      variant: 'info',
    };
  }
  return {
    label: q.viewerSide === 'OWNER' ? 'Waiting on manager' : 'Waiting on you',
    variant: 'warning',
  };
};

const AskForm = ({ onDone }: { onDone: (id: string) => void }) => {
  const mandates = useQuery({
    queryKey: ['owner-queries', 'mandates'],
    queryFn: () => unwrap(myMandates()),
  });
  const managed = (mandates.data ?? []).filter((m) => ['ACTIVE', 'SUSPENDED'].includes(m.status));
  const properties = [
    ...new Map(managed.map((m) => [m.propertyId, m.propertyTitle ?? 'Property'])).entries(),
  ];
  const [propertyId, setPropertyId] = useState('');
  const [category, setCategory] = useState<QueryCategory>('GENERAL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ask = useMutation({
    mutationFn: () =>
      unwrap(
        ownerQueryService.ask({ propertyId, category, subject: subject.trim(), body: body.trim() })
      ),
    onSuccess: (q) => onDone(q.id),
    onError: (err: Error) => setError(err.message || 'Could not send your question.'),
  });

  if (mandates.isLoading) return <CardSkeleton lines={4} />;
  if (properties.length === 0) {
    return (
      <Alert variant="neutral">
        None of your properties has a manager right now, so there is no one to ask.
      </Alert>
    );
  }
  return (
    <Card className="space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Property">
          <Select
            ariaLabel="Property"
            value={propertyId}
            onValueChange={setPropertyId}
            placeholder="Which property?"
            options={properties.map(([id, title]) => ({ value: id, label: title }))}
          />
        </Field>
        <Field label="Topic">
          <Select
            ariaLabel="Topic"
            value={category}
            onValueChange={(v) => setCategory(v as QueryCategory)}
            options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </Field>
      </div>
      <Field label="Subject" htmlFor="query-subject">
        <Input
          id="query-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. September statement"
        />
      </Field>
      <Field label="Your question" htmlFor="query-body">
        <Textarea id="query-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <p className="text-xs text-muted-foreground">
        Your manager owes you a first reply within 24 hours. The whole conversation stays here.
      </p>
      <Button
        isLoading={ask.isPending}
        disabled={!propertyId || subject.trim().length < 3 || body.trim().length < 5}
        onClick={() => ask.mutate()}
      >
        Send question
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </Card>
  );
};

const ThreadView = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const thread = useQuery({
    queryKey: ['owner-queries', 'thread', id],
    queryFn: () => unwrap(ownerQueryService.get(id)),
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['owner-queries'] });
  const onError = (err: Error) => setError(err.message || 'That did not go through.');
  const send = useMutation({
    mutationFn: () => unwrap(ownerQueryService.reply(id, reply.trim())),
    onSuccess: () => {
      setReply('');
      setError(null);
      refresh();
    },
    onError,
  });
  const resolve = useMutation({
    mutationFn: () => unwrap(ownerQueryService.resolve(id)),
    onSuccess: refresh,
    onError,
  });
  const reopen = useMutation({
    mutationFn: () => unwrap(ownerQueryService.reopen(id)),
    onSuccess: refresh,
    onError,
  });

  const q = thread.data;
  if (!q) {
    if (thread.isError)
      return (
        <PageErrorState
          headingLevel="h2"
          title="This question did not load"
          onRetry={() => void thread.refetch()}
          isRetrying={thread.isFetching}
          className="min-h-0 py-10"
        />
      );
    return <CardSkeleton lines={5} />;
  }
  const isOwner = q.viewerSide === 'OWNER';
  const resolved = q.status === 'RESOLVED';
  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
        className="-ml-3"
      >
        All questions
      </Button>
      <Card className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{q.subject}</h2>
            <p className="text-sm text-muted-foreground">
              {q.propertyTitle} · {CATEGORY_LABEL[q.category]} ·{' '}
              {isOwner ? `Managed by ${q.manager}` : `From ${q.ownerName ?? 'the owner'}`}
            </p>
            <p
              className={`mt-1 flex items-center gap-1 text-sm ${q.late ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {slaText(q)}
            </p>
          </div>
          <Badge variant={statusOf(q).variant}>{statusOf(q).label}</Badge>
        </div>

        <ol className="mt-4 space-y-3">
          {q.messages.map((m) => {
            const mineSide = m.side === q.viewerSide;
            return (
              <li key={m.id} className={`flex ${mineSide ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    mineSide ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.author}
                    {m.onBehalfOf && <> for {m.onBehalfOf}</>} · {lagos(m.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {(!resolved || isOwner) && (
          <div className="mt-4 border-t border-border pt-4">
            <Field label="Reply">
              <Textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={resolved ? 'Write to reopen this question' : 'Write a reply'}
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                isLoading={send.isPending}
                disabled={reply.trim().length < 2}
                onClick={() => send.mutate()}
              >
                Send
              </Button>
              {!resolved && (
                <Button
                  variant="outline"
                  isLoading={resolve.isPending}
                  onClick={() => resolve.mutate()}
                >
                  Mark resolved
                </Button>
              )}
              {resolved && isOwner && (
                <Button
                  variant="outline"
                  isLoading={reopen.isPending}
                  onClick={() => reopen.mutate()}
                >
                  Reopen
                </Button>
              )}
            </div>
          </div>
        )}
        {error && (
          <Alert variant="danger" className="mt-2">
            {error}
          </Alert>
        )}
      </Card>
    </div>
  );
};

/**
 * Questions between an owner and their manager, as threads on the engagement.
 * Owners ask and follow up; a firm's staff answer for the properties they
 * manage. The first-reply promise is shown on every thread.
 */
export const QueryThreads = ({ as }: { as: 'owner' | 'manager' }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const list = useQuery({
    queryKey: ['owner-queries', 'list', as],
    queryFn: () => unwrap(ownerQueryService.list(as)),
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <MessageSquareText className="h-6 w-6 text-primary" aria-hidden />
            {as === 'owner' ? 'Questions to your manager' : 'Owner questions'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {as === 'owner'
              ? 'Ask whoever manages your property. They owe you a first reply within 24 hours, and the conversation stays on record.'
              : 'Questions from the owners whose properties you manage. Reply within 24 hours; late replies are flagged to the owner and your firm.'}
          </p>
        </div>
        {as === 'owner' && !openId && (
          <Button
            className="shrink-0"
            icon={<Plus className="h-4 w-4" aria-hidden />}
            onClick={() => setAsking((v) => !v)}
          >
            Ask a question
          </Button>
        )}
      </div>

      {openId ? (
        <ThreadView id={openId} onBack={() => setOpenId(null)} />
      ) : (
        <div className="space-y-4">
          {asking && (
            <AskForm
              onDone={(id) => {
                setAsking(false);
                void list.refetch();
                setOpenId(id);
              }}
            />
          )}
          {list.isLoading ? (
            <ListSkeleton rows={4} />
          ) : list.isError && !list.data ? (
            <PageErrorState
              headingLevel="h2"
              title="Your questions did not load"
              onRetry={() => void list.refetch()}
              isRetrying={list.isFetching}
              className="min-h-0 py-10"
            />
          ) : (list.data ?? []).length === 0 ? (
            <EmptyState icon={MessageSquareText} title="No questions yet." size="compact" />
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {(list.data ?? []).map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(q.id)}
                    className="flex w-full flex-col gap-1 p-4 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{q.subject}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {q.propertyTitle} · {as === 'owner' ? q.manager : (q.ownerName ?? 'Owner')}
                        {q.lastMessage && <> · {q.lastMessage.preview}</>}
                      </p>
                      <p
                        className={`text-xs ${q.late ? 'text-destructive' : 'text-muted-foreground'}`}
                      >
                        {slaText(q)}
                      </p>
                    </div>
                    <Badge variant={statusOf(q).variant}>{statusOf(q).label}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};
