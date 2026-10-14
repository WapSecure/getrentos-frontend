import { formatCurrency, formatDate } from '@/lib/format';

export interface InvoiceLine {
  category: string;
  label: string;
  amount: number;
}

/**
 * What an invoice is made of: rent plus any recurring extras, and the period
 * it covers. Renders nothing for single-amount charges with no period.
 */
export function InvoiceLines({
  lines,
  periodStart,
  periodEnd,
}: {
  lines?: InvoiceLine[];
  periodStart?: string;
  periodEnd?: string;
}) {
  if (!lines?.length && !periodStart) return null;
  const total = (lines ?? []).reduce((sum, l) => sum + l.amount, 0);
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      {periodStart && periodEnd && (
        <p className="text-xs text-muted-foreground mb-2">
          {/* periodEnd is when the next period starts; show the last day covered. */}
          Covers {formatDate(periodStart)} –{' '}
          {formatDate(new Date(new Date(periodEnd).getTime() - 86_400_000).toISOString())}
        </p>
      )}
      {lines && lines.length > 0 && (
        <dl className="space-y-1">
          {lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{l.label}</dt>
              <dd className="text-foreground tabular-nums">{formatCurrency(l.amount)}</dd>
            </div>
          ))}
          {lines.length > 1 && (
            <div className="flex justify-between gap-3 border-t border-border pt-1 font-medium">
              <dt className="text-foreground">Total</dt>
              <dd className="text-foreground tabular-nums">{formatCurrency(total)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
