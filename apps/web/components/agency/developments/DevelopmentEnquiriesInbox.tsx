'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Send, XCircle } from '@sureground/icons';
import {
  DEVELOPMENT_ENQUIRY_COPY as COPY,
  DEVELOPMENT_ENQUIRY_LIMITS as LIMITS,
  DEVELOPMENT_ENQUIRY_STATUS_LABEL,
  type DeveloperDevelopmentEnquiry,
  type DevelopmentEnquiryStatus,
} from '@sureground/shared/showroom';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  Field,
  Select,
  Textarea,
  useToast,
} from '@sureground/ui';
import { formatDate } from '@/lib/format';
import { developmentEnquiriesService } from '@/services/developmentsService';
import { DEVELOPMENTS_KEY, ENQUIRY_COUNTS_KEY } from './DevelopmentsListView';
const inboxKey = (id: string) => [...DEVELOPMENTS_KEY, id, 'enquiries'] as const;

const STATUS_VARIANT: Record<DevelopmentEnquiryStatus, 'warning' | 'success' | 'neutral'> = {
  NEW: 'warning',
  ANSWERED: 'success',
  CLOSED: 'neutral',
};

const FILTERS: { value: 'ALL' | DevelopmentEnquiryStatus; label: string }[] = [
  { value: 'ALL', label: 'All questions' },
  { value: 'NEW', label: 'New' },
  { value: 'ANSWERED', label: 'Answered' },
  { value: 'CLOSED', label: 'Closed' },
];

/** Buyers' questions about one development, for the firm's editing seats. */
export function DevelopmentEnquiriesInbox({ developmentId }: { developmentId: string }) {
  const [filter, setFilter] = useState<'ALL' | DevelopmentEnquiryStatus>('ALL');
  const query = useQuery({
    queryKey: inboxKey(developmentId),
    queryFn: async () => {
      const res = await developmentEnquiriesService.inbox(developmentId);
      if (!res.success || !res.data) throw new Error(res.error || 'Could not load the questions.');
      return res.data;
    },
  });
  const all = query.data ?? [];
  const shown = filter === 'ALL' ? all : all.filter((e) => e.status === filter);
  const newCount = all.filter((e) => e.status === 'NEW').length;

  return (
    <Card className="scroll-mt-24 p-5" id="enquiries">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            {COPY.developerInbox}
            {newCount > 0 && <Badge variant="warning">{newCount} new</Badge>}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{COPY.developerLead}</p>
        </div>
        {all.length > 0 && (
          <div className="w-full sm:w-48">
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
              options={FILTERS}
              searchable={false}
              ariaLabel="Show questions"
            />
          </div>
        )}
      </div>
      <div className="mt-4">
        {query.isLoading ? (
          <CardSkeleton />
        ) : query.isError ? (
          <Alert variant="warning">
            {(query.error as Error).message}{' '}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
          </Alert>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={Inbox}
            size="compact"
            bare
            title={all.length ? 'Nothing here' : 'No questions yet'}
            description={
              all.length
                ? 'No questions match this filter.'
                : 'Signed-in buyers can ask a question from the public page once the development is live.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {shown.map((e) => (
              <EnquiryItem key={e.id} enquiry={e} developmentId={developmentId} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function EnquiryItem({
  enquiry: e,
  developmentId,
}: {
  enquiry: DeveloperDevelopmentEnquiry;
  developmentId: string;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState(e.answer ?? '');
  const [editing, setEditing] = useState(e.status === 'NEW');
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const trimmed = answer.trim();
  const tooShort = trimmed.length < LIMITS.answerMin;

  const put = (next: DeveloperDevelopmentEnquiry) => {
    queryClient.setQueryData<DeveloperDevelopmentEnquiry[]>(inboxKey(developmentId), (old) =>
      (old ?? []).map((x) => (x.id === next.id ? next : x))
    );
    void queryClient.invalidateQueries({ queryKey: ENQUIRY_COUNTS_KEY });
  };

  const send = async () => {
    if (tooShort) return;
    setBusy(true);
    const res = await developmentEnquiriesService.answer(developmentId, e.id, trimmed);
    setBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.error || 'Your answer was not sent. Try again.');
      return;
    }
    put(res.data);
    setEditing(false);
    toast.success('Answer sent. The buyer is told in the app and by email.');
  };

  const close = async () => {
    setBusy(true);
    const res = await developmentEnquiriesService.close(developmentId, e.id);
    setBusy(false);
    setConfirmClose(false);
    if (!res.success || !res.data) {
      toast.error(res.error || 'That did not save. Try again.');
      return;
    }
    put(res.data);
    toast.success('Question closed.');
  };

  return (
    <li className="rounded-xl border border-border bg-background p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{e.buyerName}</span> asked on{' '}
          {formatDate(e.createdAt)}
          {e.unitTypeName ? ` · ${e.unitTypeName}` : ''}
        </p>
        <Badge variant={STATUS_VARIANT[e.status]}>
          {DEVELOPMENT_ENQUIRY_STATUS_LABEL[e.status].developer}
        </Badge>
      </div>
      <p className="mt-2 whitespace-pre-line text-foreground">{e.message}</p>

      {e.answer && !editing && (
        <div className="mt-3 rounded-lg bg-secondary/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Answered{e.answeredByName ? ` by ${e.answeredByName}` : ''}
            {e.answeredAt ? ` on ${formatDate(e.answeredAt)}` : ''}
          </p>
          <p className="mt-1 whitespace-pre-line text-foreground">{e.answer}</p>
        </div>
      )}

      {e.status !== 'CLOSED' && editing && (
        <div className="mt-3 space-y-3">
          <Field
            label={e.answer ? 'Change your answer' : 'Your answer'}
            hint="The buyer sees this answer as your firm's. Do not ask for payment here."
          >
            <Textarea
              value={answer}
              rows={3}
              maxLength={LIMITS.answerMax}
              onChange={(ev) => setAnswer(ev.target.value)}
            />
          </Field>
        </div>
      )}

      {e.status !== 'CLOSED' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button
                size="sm"
                icon={<Send className="h-4 w-4" aria-hidden />}
                disabled={tooShort || busy}
                isLoading={busy}
                onClick={() => void send()}
                aria-label={`Send answer to ${e.buyerName}`}
              >
                Send answer
              </Button>
              {e.answer && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAnswer(e.answer ?? '');
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Change answer
            </Button>
          )}
          <Button
            size="sm"
            variant="danger-ghost"
            icon={<XCircle className="h-4 w-4" aria-hidden />}
            disabled={busy}
            onClick={() => setConfirmClose(true)}
            aria-label={`Close the question from ${e.buyerName}`}
          >
            Close question
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close this question?"
        description={
          e.status === 'NEW'
            ? 'It has not been answered. The buyer will see it as closed, and you cannot answer it afterwards.'
            : 'You cannot change the answer after closing it.'
        }
        confirmLabel="Close question"
        onConfirm={close}
        isLoading={busy}
      />
    </li>
  );
}
