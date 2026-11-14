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
export function ServiceChargeQueriesInbox({ propertyId }: { propertyId?: string }) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<Action>(null);
  const queries = useQuery({
    queryKey: homeManagementKeys.utilities.serviceChargeQueries(propertyId),
    queryFn: () => unwrap(serviceChargesService.queries({ propertyId })),
  });
  const live = (queries.data?.items ?? []).filter(
    (q) => q.status === 'OPEN' || q.status === 'ANSWERED'
  );
  const done = () => {
    setAction(null);
    void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
  };
  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      unwrap(serviceChargesService.rejectQuery(id, note)),
    onSuccess: done,
  });

  if (live.length === 0) return null;
  return (
    <section aria-labelledby="sc-queries-heading" className="space-y-3">
      <div>
        <h3 id="sc-queries-heading" className="font-semibold text-foreground">
          Queries from tenants ({live.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Reply, then decide. Upholding can credit the tenancy; the credit goes towards their
          charges and is never paid out as cash.
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
                  {query.invoice.tenant ?? 'Tenant'}, {query.invoice.unit}
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
          {action?.kind === 'reply' && <ReplyForm query={action.query} onDone={done} />}
          {action?.kind === 'uphold' && <UpholdForm query={action.query} onDone={done} />}
        </DialogContent>
      </Dialog>
      <ReasonDialog
        open={action?.kind === 'reject'}
        onOpenChange={(open) => !open && setAction(null)}
        title="Not upheld"
        description="Explain why. The tenant sees this, and the charge stays as billed."
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

function ReplyForm({ query, onDone }: { query: ServiceChargeQuery; onDone: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const reply = useMutation({
    mutationFn: () => unwrap(serviceChargesService.respondToQuery(query.id, text.trim())),
    onSuccess: () => {
      toast.success('Reply sent to the tenant.');
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

function UpholdForm({ query, onDone }: { query: ServiceChargeQuery; onDone: () => void }) {
  const toast = useToast();
  const cap = query.line?.amount ?? query.invoice.amount;
  const [note, setNote] = useState('');
  const [credit, setCredit] = useState(0);
  const uphold = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        credit > 0
          ? `Credit ${formatCurrency(credit)} to ${query.invoice.tenant ?? 'the tenant'}'s tenancy`
          : `Uphold a service charge query`,
        () => unwrap(serviceChargesService.upholdQuery(query.id, note.trim(), credit))
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
        The charge itself is not changed. A credit lands on the tenancy and pays towards their
        charges; it is never paid out as cash. You will be asked to confirm it is you.
      </DialogDescription>
      <div className="mt-6 space-y-4">
        <Field label="What the tenant is told" required>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={1000}
          />
        </Field>
        <Field label="Credit to the tenancy" hint={`Optional, at most ${formatCurrency(cap)}`}>
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
