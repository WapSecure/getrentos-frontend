'use client';

import { ReceiptText } from '@sureground/icons';
import { formatCurrency } from '@sureground/shared';
import { Badge, Card, CardSkeleton, DataTable, type BadgeVariant } from '@sureground/ui';
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

function StatusPill({ status }: { status: SubscriptionInvoice['status'] }) {
  const variants: Record<SubscriptionInvoice['status'], BadgeVariant> = {
    PAID: 'success',
    REFUNDED: 'neutral',
    FAILED: 'danger',
  };
  const labels: Record<SubscriptionInvoice['status'], string> = {
    PAID: 'Paid',
    REFUNDED: 'Refunded',
    FAILED: 'Failed',
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

// Rendered for Free accounts too: a customer who cancelled still needs their receipts.
export function BillingHistoryCard() {
  const { invoices, isLoading } = useInvoices();

  if (isLoading) {
    return <CardSkeleton lines={4} />;
  }

  if (!invoices || invoices.items.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Billing history</p>
          <p className="text-xs text-muted-foreground">
            Every charge on your account, with its invoice number for your records.
          </p>
        </div>
      </div>

      <DataTable
        variant="bare"
        caption="Billing history"
        className="mt-5"
        data={invoices.items}
        getRowKey={(invoice) => invoice.id}
        columns={[
          {
            key: 'date',
            header: 'Date',
            className: 'whitespace-nowrap text-muted-foreground',
            render: (invoice) => day(invoice.paidAt ?? invoice.createdAt),
          },
          {
            key: 'description',
            header: 'Description',
            render: (invoice) => (
              <>
                <p className="text-foreground">{invoice.description}</p>
                {invoice.periodStart && invoice.periodEnd && (
                  <p className="text-xs text-muted-foreground">
                    {day(invoice.periodStart)} – {day(invoice.periodEnd)}
                  </p>
                )}
              </>
            ),
          },
          {
            key: 'invoice',
            header: 'Invoice',
            className: 'font-mono text-xs text-muted-foreground',
            render: (invoice) => invoice.number,
          },
          {
            key: 'amount',
            header: 'Amount',
            numeric: true,
            className: 'whitespace-nowrap font-medium text-foreground',
            render: (invoice) => naira(invoice.amountKobo),
          },
          {
            key: 'status',
            header: 'Status',
            align: 'right',
            render: (invoice) => <StatusPill status={invoice.status} />,
          },
        ]}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        Questions about a charge? Quote the invoice number and we can find it straight away.
      </p>
    </Card>
  );
}
