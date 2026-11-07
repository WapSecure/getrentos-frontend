'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, ReceiptText, Scale } from 'lucide-react';
import {
  Badge,
  Card,
  DatePicker,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  StatCard,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import {
  adminCollectionsReconciliationService,
  type CollectionLineKind,
  type CollectionProduct,
  type PaymentProvider,
} from '@/services/adminCollectionsReconciliationService';

const PRODUCT: Record<CollectionProduct | 'UNKNOWN', string> = {
  RENT: 'Rent',
  RENT_LEGACY: 'Rent (older payments)',
  ESCROW: 'Sale deposit',
  SHORTLET: 'Short-let stay',
  LAND: 'Land',
  FLEX: 'Flex instalment',
  DUES: 'Estate dues',
  VENDOR_TOP_UP: 'Vendor invoice top-up',
  SUBSCRIPTION: 'Subscription',
  UNKNOWN: 'Not recognised',
};

const KIND: Record<
  Exclude<CollectionLineKind, 'MATCHED'>,
  { label: string; variant: BadgeVariant; help: string }
> = {
  NOT_APPLIED: {
    label: 'Paid, not applied',
    variant: 'danger',
    help: 'The payment company took the money but the record is not marked paid. The recovery sweep normally fixes this within the hour; if it is still here, check the payment with that company and apply it.',
  },
  AMOUNT_MISMATCH: {
    label: 'Amount differs',
    variant: 'warning',
    help: 'The payment company and the record disagree on the amount. Check the unmatched payments queue: the difference is refunded or applied there.',
  },
  UNKNOWN_REFERENCE: {
    label: 'Not recognised',
    variant: 'warning',
    help: 'No record in any product has this reference. Look it up with the payment company shown to see who paid and what for.',
  },
  MISSING_AT_GATEWAY: {
    label: 'Not at the payment company',
    variant: 'danger',
    help: 'Marked paid by card or transfer, but no payment company has a successful charge for it. Find out who marked it paid before any of it is paid out.',
  },
};

/** A YYYY-MM-DD Lagos day, `daysAgo` days before today. */
function lagosDay(daysAgo: number): string {
  const lagosNow = new Date(Date.now() + 60 * 60_000);
  return new Date(lagosNow.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10);
}

const PROVIDER: Record<PaymentProvider, string> = { PAYSTACK: 'Paystack', MONNIFY: 'Monnify' };

const amountOrDash = (n: number | null) => (n === null ? '—' : formatCurrency(n));

/**
 * Every Paystack and Monnify collection checked against the record it paid for, on every
 * product: rent, sale deposits, short-lets, land, Flex, estate dues, vendor
 * top-ups and subscriptions. The same check runs every night for the day
 * before and flags new problems in the audit log; this page runs it for any
 * range up to 31 days. It only reads.
 */
export default function CollectionsReconciliationPage() {
  const [from, setFrom] = useState(() => lagosDay(1));
  const [to, setTo] = useState(() => lagosDay(1));

  const query = useQuery({
    queryKey: ['admin', 'collections-reconciliation', from, to],
    queryFn: () => unwrap(adminCollectionsReconciliationService.report(from, to)),
    enabled: !!from && !!to,
    placeholderData: keepPreviousData,
    retry: false,
    // A refused range (no gateway, too long) is shown here, not as a crashed page.
    throwOnError: false,
  });
  const report = query.data;
  const products = report
    ? Object.entries(report.byProduct).sort((a, b) => b[1].amount - a[1].amount)
    : [];

  return (
    <>
      <PageHeader
        title="Collections reconciliation"
        description="Every payment Paystack or Monnify collected, checked against the rent, deposit, booking, dues or other record it paid for, and every record marked paid by card checked against the company that took it. Runs nightly for the day before; choose any range up to 31 days here."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <DatePicker
          ariaLabel="From date"
          placeholder="From"
          value={from}
          max={to || undefined}
          onChange={setFrom}
          className="w-40"
        />
        <DatePicker
          ariaLabel="To date"
          placeholder="To"
          value={to}
          min={from || undefined}
          max={lagosDay(0)}
          onChange={setTo}
          className="w-40"
        />
        <p className="text-xs text-muted-foreground">Lagos days, both included.</p>
      </div>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !report ? (
        <PageErrorState
          title="Could not reconcile this range"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : report ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ArrowDownLeft}
              label="Collected"
              value={report.totals.gatewayIn}
              isCurrency
              accent="primary"
            />
            <StatCard
              icon={ReceiptText}
              label="Payment company fees"
              value={report.totals.gatewayFees}
              isCurrency
              subtitle="Kept by Paystack and Monnify, paid by GetRentos"
            />
            <StatCard
              icon={ArrowUpRight}
              label="Refunded"
              value={report.totals.refundsOut}
              isCurrency
            />
            <StatCard
              icon={Scale}
              label="Need a look"
              value={report.totals.exceptions}
              subtitle={`${report.totals.matched} matched`}
              accent={report.totals.exceptions ? 'orange' : 'emerald'}
            />
          </div>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Needs a look</h2>
            {report.exceptions.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Everything lines up"
                description="Every collection matches its record, and every card payment on record is at its payment company."
              />
            ) : (
              <div className="space-y-3">
                {report.exceptions.map((line) => {
                  const kind = KIND[line.kind as Exclude<CollectionLineKind, 'MATCHED'>];
                  return (
                    <Card key={`${line.kind}-${line.reference}`} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {PRODUCT[line.product ?? 'UNKNOWN']} · {line.reference}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {line.provider ? PROVIDER[line.provider] : 'Payment company'}{' '}
                            {amountOrDash(line.gatewayAmount)} · our record{' '}
                            {amountOrDash(line.bookAmount)}
                            {line.inUnmatchedQueue ? ' · already in unmatched payments' : ''}
                          </p>
                        </div>
                        <Badge variant={kind.variant}>{kind.label}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{kind.help}</p>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {report.byProvider && Object.keys(report.byProvider).length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">By payment company</h2>
              <Card className="divide-y divide-border">
                {(
                  Object.entries(report.byProvider) as [
                    PaymentProvider,
                    { count: number; amount: number; fees: number },
                  ][]
                ).map(([provider, bucket]) => (
                  <div key={provider} className="flex items-center justify-between gap-3 px-5 py-3">
                    <p className="text-sm text-foreground">{PROVIDER[provider]}</p>
                    <p className="text-sm text-muted-foreground">
                      {bucket.count} · {formatCurrency(bucket.amount)} · fees{' '}
                      {formatCurrency(bucket.fees)}
                    </p>
                  </div>
                ))}
              </Card>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">By product</h2>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No collections in this range.</p>
            ) : (
              <Card className="divide-y divide-border">
                {products.map(([product, bucket]) => (
                  <div key={product} className="flex items-center justify-between gap-3 px-5 py-3">
                    <p className="text-sm text-foreground">
                      {PRODUCT[product as CollectionProduct | 'UNKNOWN'] ?? product}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {bucket.count} · {formatCurrency(bucket.amount)}
                    </p>
                  </div>
                ))}
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold text-foreground">Paid into the bank</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Paystack settlements to the GetRentos account. They run a day or so behind
              collections, so they will not equal what was collected in the same days.
            </p>
            {(report.settlements ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No settlements in this range.</p>
            ) : (
              <Card className="divide-y divide-border">
                {(report.settlements ?? []).map((st) => (
                  <div
                    key={`${st.provider}-${st.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {PROVIDER[st.provider]} ·{' '}
                        {st.settledAt ? formatDate(st.settledAt) : 'Date not given'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fees {formatCurrency(st.fees)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          st.status === 'success'
                            ? 'success'
                            : st.status === 'failed'
                              ? 'danger'
                              : 'info'
                        }
                      >
                        {st.status === 'success'
                          ? 'Paid in'
                          : st.status === 'failed'
                            ? 'Failed'
                            : 'On its way'}
                      </Badge>
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(st.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </section>

          {report.refunds.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">Refunds</h2>
              <Card className="divide-y divide-border">
                {report.refunds.map((r, i) => (
                  <div
                    key={`${r.reference}-${i}`}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <p className="min-w-0 truncate text-sm text-foreground">
                      {PRODUCT[r.product ?? 'UNKNOWN']} · {r.reference}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(r.amount)}</p>
                  </div>
                ))}
              </Card>
            </section>
          )}

          <p className="text-xs text-muted-foreground">
            Checked {formatDate(report.from)} to{' '}
            {formatDate(new Date(new Date(report.to).getTime() - 1).toISOString())}. Monnify wallet
            settlements are not listed here yet.
          </p>
        </div>
      ) : null}
    </>
  );
}
