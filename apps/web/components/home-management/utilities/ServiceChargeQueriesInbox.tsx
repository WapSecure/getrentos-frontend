'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SERVICE_CHARGE_QUERY_STATUS_LABELS,
  formatCurrency,
  withStepUpSummary,
  type ServiceChargeQuery,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  ReasonDialog,
  Textarea,
  useToast,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import { serviceChargesService } from '@/services/serviceChargesService';
import { formatDay } from './ServiceChargePanel';

type Action = { kind: 'reply' | 'reject' | 'uphold'; query: ServiceChargeQuery } | null;

/** Tenants' open queries on service charges, newest first. Only shown when there is something to answer. */
/** Where the queries come from: a property's tenants (default) or an estate's residents. */
export interface QueriesSource {
  queryKey: readonly unknown[];
  invalidateKey: readonly unknown[];
  list: () => Promise<ServiceChargeQuery[]>;
  respond: (id: string, response: string) => Promise<unknown>;
  reject: (id: string, note: string) => Promise<unknown>;
  uphold: (id: string, note: string, credit: number) => Promise<unknown>;
  /** "tenants" or "residents". */
  who: string;
  /** What a credit does, e.g. "lands on the tenancy and pays towards their charges". */
  creditEffect: string;
  creditLabel: string;
}

const propertySource = (propertyId?: string): QueriesSource => ({
  queryKey: homeManagementKeys.utilities.serviceChargeQueries(propertyId),
  invalidateKey: homeManagementKeys.utilities.all,
  list: async () => (await unwrap(serviceChargesService.queries({ propertyId }))).items,
  respond: (id, response) => unwrap(serviceChargesService.respondToQuery(id, response)),
  reject: (id, note) => unwrap(serviceChargesService.rejectQuery(id, note)),
  uphold: (id, note, credit) => unwrap(serviceChargesService.upholdQuery(id, note, credit)),
  who: 'tenants',
  creditEffect: 'lands on the tenancy and pays towards their charges; it is never paid out as cash',
  creditLabel: 'Credit to the tenancy',
});

export function ServiceChargeQueriesInbox({
  propertyId,
  source,
}: {
  propertyId?: string;
  source?: QueriesSource;
}) {
  const api = source ?? propertySource(propertyId);
  const queryClient = useQueryClient();
  const [action, setAction] = useState<Action>(null);
  const queries = useQuery({
    queryKey: api.queryKey,
    queryFn: () => api.list(),
  });
  const live = (queries.data ?? []).filter((q) => q.status === 'OPEN' || q.status === 'ANSWERED');
  const done = () => {
    setAction(null);
    void queryClient.invalidateQueries({ queryKey: api.invalidateKey });
    void queryClient.invalidateQueries({ queryKey: api.queryKey });
  };
  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.reject(id, note),
    onSuccess: done,
  });

  if (live.length === 0) return null;
  return (
    <section aria-labelledby="sc-queries-heading" className="space-y-3">
      <div>
        <h3 id="sc-queries-heading" className="font-semibold text-foreground">
          Queries from {api.who} ({live.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Reply, then decide. Upholding can give a credit, which {api.creditEffect}.
        </p>
      </div>
      <ul className="space-y-3">
        {live.map((query) => (
          <li key={query.id}>
            <Card className="space-y-2 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={query.status === 'OPEN' ? 'warning' : 'info'}>
                  {SERVICE_CHARGE_QUERY_STATUS_LABELS[query.status]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {query.invoice.tenant ?? query.invoice.unit}
                  {query.invoice.tenant ? `, ${query.invoice.unit}` : ''}
                  {query.budget.property ? ` at ${query.budget.property.title}` : ''} ·{' '}
                  {query.budget.title} ·{' '}
                  {query.line
                    ? `${query.line.label} (${formatCurrency(query.line.amount)})`
                    : `whole charge (${formatCurrency(query.invoice.amount)})`}
                </span>
              </div>
              <p className="text-sm text-foreground">{query.reason}</p>
              {query.response && (
                <p className="rounded-xl bg-secondary/60 p-3 text-sm">
                  <span className="font-medium">Your reply: </span>
                  {query.response}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Raised {formatDay(query.createdAt.slice(0, 10))}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAction({ kind: 'reply', query })}
                >
                  {query.response ? 'Reply again' : 'Reply'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAction({ kind: 'uphold', query })}
                >
                  Uphold
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAction({ kind: 'reject', query })}
                >
                  Not upheld
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog
        open={action?.kind === 'reply' || action?.kind === 'uphold'}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <DialogContent size="lg">
          {action?.kind === 'reply' && <ReplyForm query={action.query} api={api} onDone={done} />}
          {action?.kind === 'uphold' && <UpholdForm query={action.query} api={api} onDone={done} />}
        </DialogContent>
      </Dialog>
      <ReasonDialog
        open={action?.kind === 'reject'}
        onOpenChange={(open) => !open && setAction(null)}
        title="Not upheld"
        description="Explain why. They see this, and the charge stays as billed."
        reasonLabel="Why is it not upheld?"
        reasonPlaceholder="e.g. Diesel use matches the generator log for the quarter"
        minLength={3}
        maxLength={1000}
        confirmLabel="Send decision"
        error={reject.error?.message}
        onSubmit={({ reason }) => reject.mutateAsync({ id: action!.query.id, note: reason })}
      />
    </section>
  );
}

function ReplyForm({
  query,
  api,
  onDone,
}: {
  query: ServiceChargeQuery;
  api: QueriesSource;
  onDone: () => void;
}) {
  const toast = useToast();
  const [text, setText] = useState('');
  const reply = useMutation({
    mutationFn: () => api.respond(query.id, text.trim()),
    onSuccess: () => {
      toast.success('Reply sent.');
      onDone();
    },
  });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim().length >= 3) reply.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Reply to the tenant
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        &ldquo;{query.reason}&rdquo;
      </DialogDescription>
      <Field label="Your reply" required className="mt-6">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          maxLength={2000}
        />
      </Field>
      {reply.error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {reply.error.message}
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={text.trim().length < 3} isLoading={reply.isPending}>
          Send reply
        </Button>
      </div>
    </form>
  );
}

function UpholdForm({
  query,
  api,
  onDone,
}: {
  query: ServiceChargeQuery;
  api: QueriesSource;
  onDone: () => void;
}) {
  const toast = useToast();
  const cap = query.line?.amount ?? query.invoice.amount;
  const [note, setNote] = useState('');
  const [credit, setCredit] = useState(0);
  const uphold = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        credit > 0
          ? `Credit ${formatCurrency(credit)} to ${query.invoice.tenant ?? query.invoice.unit}`
          : `Uphold a service charge query`,
        () => api.uphold(query.id, note.trim(), credit)
      ),
    onSuccess: () => {
      toast.success(
        credit > 0 ? 'Upheld. The credit goes towards the tenant’s charges.' : 'Upheld.'
      );
      onDone();
    },
  });
  const valid = note.trim().length >= 3 && credit >= 0 && credit <= cap;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) uphold.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Uphold this query
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        The charge itself is not changed. A credit {api.creditEffect}. You will be asked to confirm
        it is you.
      </DialogDescription>
      <div className="mt-6 space-y-4">
        <Field label="What they are told" required>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={1000}
          />
        </Field>
        <Field label={api.creditLabel} hint={`Optional, at most ${formatCurrency(cap)}`}>
          <CurrencyInput value={credit || ''} onValueChange={setCredit} placeholder="0" />
        </Field>
      </div>
      {credit > cap && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          The credit can be at most {formatCurrency(cap)}, what was queried.
        </p>
      )}
      {uphold.error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {uphold.error.message}
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={!valid} isLoading={uphold.isPending}>
          Uphold
        </Button>
      </div>
    </form>
  );
}
