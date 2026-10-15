import { formatCurrency, formatDate } from '@/lib/format';

export interface CreditRefundRow {
  id: string;
  amount: number;
  refundedAmount: number;
  status: 'PROCESSING' | 'REFUNDED' | 'PARTLY_REFUNDED' | 'FAILED';
  requestedAs: 'TENANT' | 'MANAGER' | 'ADMIN';
  createdAt: string;
}

const WHO: Record<CreditRefundRow['requestedAs'], string> = {
  TENANT: 'by the tenant',
  MANAGER: 'by the landlord',
  ADMIN: 'by GetRentos',
};

/** Lease credit paid back: what went back, and what returned to credit if the gateway refused. */
export function CreditRefundHistory({ refunds }: { refunds?: CreditRefundRow[] }) {
  if (!refunds?.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {refunds.slice(0, 5).map((r) => (
        <li key={r.id} className="text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              Credit refunded {formatDate(r.createdAt)} {WHO[r.requestedAs]}
            </span>
            <span className="text-foreground tabular-nums">{formatCurrency(r.refundedAmount)}</span>
          </div>
          {r.status === 'PROCESSING' && (
            <p className="text-muted-foreground">
              Being refunded to the card or account it came from.
            </p>
          )}
          {(r.status === 'FAILED' || r.status === 'PARTLY_REFUNDED') && (
            <p className="text-warning">
              {formatCurrency(r.amount - r.refundedAmount)} could not be refunded and is back as
              credit. GetRentos finance sees failed refunds and follows up.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
