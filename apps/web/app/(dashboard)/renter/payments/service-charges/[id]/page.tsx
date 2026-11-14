'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceiptText } from '@sureground/icons';
import {
  SERVICE_CHARGE_CATEGORY_LABELS,
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_QUERY_STATUS_LABELS,
  formatCurrency,
  hasLiveQuery,
  statementShareBasis,
  type RenterServiceChargeStatement,
} from '@sureground/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { renterServiceChargesService } from '@/services/renterServiceChargesService';
import { RENTER_COLLECTION, formatDay } from '@/components/renter/payments/ServiceChargesTab';

/** One service charge as a statement: what you owe, the budget it comes from, and how your share was worked out. */
export default function ServiceChargeStatementPage() {
  const { id } = useParams<{ id: string }>();
  const statement = useQuery({
    queryKey: renterKeys.serviceCharge(id),
    queryFn: () => unwrap(renterServiceChargesService.get(id)),
  });
  const [querying, setQuerying] = useState(false);
  const data = statement.data;

  const breadcrumbs = [
    { label: 'Payments', href: '/renter/payments?tab=service-charges' },
    { label: data?.title ?? 'Service charge' },
  ];

  if (statement.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Service charge" breadcrumbs={breadcrumbs} />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Service charge" breadcrumbs={breadcrumbs} />
        <EmptyState
          icon={ReceiptText}
          title="This service charge could not be found"
          description="It may belong to another tenancy. Go back to Payments to see yours."
          action={
            <Link
              href="/renter/payments"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to Payments
            </Link>
          }
        />
      </div>
    );
  }

  const status = RENTER_COLLECTION[data.collection];
  const canQuery =
    !hasLiveQuery(data.queries, null) ||
    data.lines.some((line) => !hasLiveQuery(data.queries, line.id));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Service charge"
        title={data.title}
        description={`${data.unit}${data.property ? `, ${data.property}` : ''}. ${data.instalment > 1 ? `Instalment ${data.instalment}, ` : ''}${formatDay(data.periodStart)} to ${formatDay(data.periodEnd)}.`}
        breadcrumbs={breadcrumbs}
        actions={
          canQuery ? (
            <Button variant="outline" onClick={() => setQuerying(true)}>
              Raise a query
            </Button>
          ) : null
        }
      />

      <Card className="grid gap-4 rounded-2xl p-5 sm:grid-cols-3">
        <Figure label="Your share" value={formatCurrency(data.amount)} />
        <Figure label="Due" value={formatDay(data.dueDate)} />
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            {data.amountPaid > 0 && data.collection !== 'PAID' && (
              <span className="text-sm text-muted-foreground">
                {formatCurrency(data.amountPaid)} paid
              </span>
            )}
          </div>
        </div>
        {data.collection === 'UNPAID' || data.collection === 'PART_PAID' ? (
          <p className="text-sm text-muted-foreground sm:col-span-3">
            Pay it with your rent under{' '}
            <Link
              href="/renter/payments"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Payments
            </Link>
            , where it is listed as a service charge.
          </p>
        ) : null}
        {data.collection === 'REMOVED' && (
          <p className="text-sm text-muted-foreground sm:col-span-3">
            This charge was removed when the tenancy ended before it was paid. You do not owe it.
          </p>
        )}
      </Card>

      <Card className="space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="font-semibold text-foreground">How your share was worked out</h2>
          <p className="text-sm text-muted-foreground">
            The building&apos;s budget for {formatDay(data.budget.periodStart)} to{' '}
            {formatDay(data.budget.lastDay)} is {formatCurrency(data.budget.total)}, billed{' '}
            {SERVICE_CHARGE_CYCLE_LABELS[data.budget.billingCycle].toLowerCase()}.{' '}
            {statementShareBasis(data.budget)}.
            {data.partOfInstalment !== null &&
              ` Your tenancy covered ${data.partOfInstalment}% of this instalment, so you pay that part of it.`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">Your share of each budget line</caption>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  Line
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Whole budget
                </th>
                {data.budget.spentSoFar !== null && (
                  <th scope="col" className="py-2 text-right font-medium">
                    Spent so far
                  </th>
                )}
                <th scope="col" className="py-2 text-right font-medium">
                  Your share
                </th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <tr key={line.id} className="border-b last:border-0">
                  <td className="py-2.5">
                    <p className="font-medium text-foreground">{line.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {SERVICE_CHARGE_CATEGORY_LABELS[line.category]}
                    </p>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                    {line.budgetTotal === null ? '' : formatCurrency(line.budgetTotal)}
                  </td>
                  {data.budget.spentSoFar !== null && (
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(line.spentSoFar ?? 0)}
                    </td>
                  )}
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    {formatCurrency(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Shares are worked out to the naira; any spare naira from rounding is spread between units.
          {data.budget.spentSoFar !== null &&
            ` This budget is open book: ${formatCurrency(data.budget.spentSoFar)} has been spent so far, counted from the purchases and invoices your landlord has recorded.`}
        </p>
      </Card>

      <section aria-labelledby="queries-heading" className="space-y-3">
        <h2 id="queries-heading" className="font-semibold text-foreground">
          Your queries
        </h2>
        {data.queries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            If something looks wrong, raise a query within 90 days of the charge. Your landlord or
            their agency replies here.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.queries.map((query) => (
              <QueryCard key={query.id} statement={data} query={query} />
            ))}
          </ul>
        )}
      </section>

      <Dialog open={querying} onOpenChange={setQuerying}>
        <DialogContent size="lg">
          <RaiseQueryForm statement={data} onDone={() => setQuerying(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-[-0.01em] text-foreground">{value}</p>
    </div>
  );
}

function QueryCard({
  statement,
  query,
}: {
  statement: RenterServiceChargeStatement;
  query: RenterServiceChargeStatement['queries'][number];
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const withdraw = useMutation({
    mutationFn: () => unwrap(renterServiceChargesService.withdrawQuery(query.id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: renterKeys.serviceCharges });
      toast.success('Query withdrawn.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const line = statement.lines.find((l) => l.id === query.lineId);
  const live = query.status === 'OPEN' || query.status === 'ANSWERED';
  return (
    <li>
      <Card className="space-y-2 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              query.status === 'UPHELD'
                ? 'success'
                : query.status === 'REJECTED'
                  ? 'warning'
                  : 'info'
            }
          >
            {SERVICE_CHARGE_QUERY_STATUS_LABELS[query.status]}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {line ? `About ${line.label}` : 'About the whole charge'} ·{' '}
            {formatDay(query.createdAt.slice(0, 10))}
          </span>
        </div>
        <p className="text-sm text-foreground">{query.reason}</p>
        {query.response && (
          <p className="rounded-xl bg-secondary/60 p-3 text-sm text-foreground">
            <span className="font-medium">Reply: </span>
            {query.response}
          </p>
        )}
        {query.outcomeNote && (
          <p className="text-sm text-foreground">
            <span className="font-medium">Decision: </span>
            {query.outcomeNote}
            {query.adjustmentAmount
              ? ` ${formatCurrency(query.adjustmentAmount)} was credited to your tenancy.`
              : ''}
          </p>
        )}
        {live && (
          <Button
            variant="ghost"
            size="sm"
            isLoading={withdraw.isPending}
            onClick={() => withdraw.mutate()}
          >
            Withdraw query
          </Button>
        )}
      </Card>
    </li>
  );
}

function RaiseQueryForm({
  statement,
  onDone,
}: {
  statement: RenterServiceChargeStatement;
  onDone: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const options = [
    ...(hasLiveQuery(statement.queries, null) ? [] : [{ value: '', label: 'The whole charge' }]),
    ...statement.lines
      .filter((line) => !hasLiveQuery(statement.queries, line.id))
      .map((line) => ({ value: line.id, label: `${line.label} (${formatCurrency(line.amount)})` })),
  ];
  const [lineId, setLineId] = useState(options[0]?.value ?? '');
  const [reason, setReason] = useState('');
  const raise = useMutation({
    mutationFn: () =>
      unwrap(
        renterServiceChargesService.raiseQuery(statement.id, {
          reason: reason.trim(),
          ...(lineId ? { invoiceLineId: lineId } : {}),
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: renterKeys.serviceCharges });
      toast.success('Query sent. You will be told when there is a reply.');
      onDone();
    },
  });
  const valid = reason.trim().length >= 10;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) raise.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Raise a query
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Your landlord or their agency replies, then decides. If they agree, they can credit your
        tenancy, which goes towards your charges.
      </DialogDescription>
      <div className="mt-6 space-y-4">
        <Field label="About" required>
          <Select ariaLabel="About" value={lineId} onValueChange={setLineId} options={options} />
        </Field>
        <Field label="What looks wrong?" required hint="At least 10 characters">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            maxLength={1000}
          />
        </Field>
      </div>
      {raise.error && (
        <Alert variant="danger" className="mt-4">
          {raise.error.message}
        </Alert>
      )}
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={!valid} isLoading={raise.isPending}>
          Send query
        </Button>
      </div>
    </form>
  );
}
