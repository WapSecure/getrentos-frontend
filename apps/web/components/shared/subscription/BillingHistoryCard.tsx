'use client';

import { Receipt } from 'lucide-react';
import { formatCurrency } from '@getrentos/shared';
import { useInvoices } from '@/hooks/useBilling';
import type { SubscriptionInvoice } from '@/services/billingService';

const naira = (kobo: number) => formatCurrency(kobo / 100);

/** Short date without a timezone trap: we only ever show the day. */
const day = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/** Status pill, wording kept to what the customer needs to know. */
function StatusPill({ status }: { status: SubscriptionInvoice['status'] }) {
  const styles: Record<SubscriptionInvoice['status'], string> = {
    PAID: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    REFUNDED: 'bg-secondary text-muted-foreground',
    FAILED: 'bg-destructive/10 text-destructive',
  };
  const labels: Record<SubscriptionInvoice['status'], string> = {
    PAID: 'Paid',
    REFUNDED: 'Refunded',
    FAILED: 'Failed',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

/**
 * The customer's payment history.
 *
 * Exists because "you were charged" is not a receipt. Someone doing their books
 * (or reconciling a bank statement) needs the amount, the date, and the period
 * it covered — and a line item explaining every debit they can see, including
 * the card-verification charge we take and refund.
 *
 * Rendered for Free accounts as well as Pro: a customer who cancelled still
 * needs this, and their history must not disappear with their plan.
 */
export function BillingHistoryCard() {
  const { invoices, isLoading } = useInvoices();

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />;
  }

  // Nothing charged yet: an empty table would just be noise on a free account.
  if (!invoices || invoices.items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Billing history</p>
          <p className="text-xs text-muted-foreground">
            Every charge on your account, with its invoice number for your records.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium">Invoice</th>
              <th className="pb-2 text-right font-medium">Amount</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.items.map((invoice) => (
              <tr key={invoice.id} className="border-b border-border/60 last:border-0">
                <td className="py-3 whitespace-nowrap text-muted-foreground">
                  {day(invoice.paidAt ?? invoice.createdAt)}
                </td>
                <td className="py-3">
                  <p className="text-foreground">{invoice.description}</p>
                  {invoice.periodStart && invoice.periodEnd && (
                    <p className="text-xs text-muted-foreground">
                      {day(invoice.periodStart)} – {day(invoice.periodEnd)}
                    </p>
                  )}
                </td>
                <td className="py-3 font-mono text-xs text-muted-foreground">{invoice.number}</td>
                <td className="py-3 text-right whitespace-nowrap font-medium text-foreground">
                  {naira(invoice.amountKobo)}
                </td>
                <td className="py-3 text-right">
                  <StatusPill status={invoice.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Questions about a charge? Quote the invoice number and we can find it straight away.
      </p>
    </div>
  );
}
