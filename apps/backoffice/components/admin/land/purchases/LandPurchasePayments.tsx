import { Banknote } from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import type { LandEscrowRelease, LandPurchasePayment } from '@/types/landPurchase';
import { LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';
import { LandLineStatusBadge } from './LandPurchaseStatusBadge';

/** Money in (buyer payments) and money out (escrow releases to the developer). */
export const LandPurchasePayments = ({
  payments,
  releases,
}: {
  payments: LandPurchasePayment[];
  releases: LandEscrowRelease[];
}) => (
  <LandCaseSection title="Payments & releases" icon={Banknote}>
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      Buyer payments
    </h3>
    {payments.length === 0 ? (
      <PanelMessage>No payments yet.</PanelMessage>
    ) : (
      <ul className="divide-y divide-border rounded-xl border border-border">
        {payments.map((payment) => (
          <li
            key={payment.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{formatCurrency(payment.amount)}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {payment.providerReference} · {formatDate(payment.confirmedAt ?? payment.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {payment.simulated && <Badge variant="warning">Simulated</Badge>}
              <LandLineStatusBadge status={payment.status} />
            </div>
          </li>
        ))}
      </ul>
    )}

    <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      Escrow releases to the developer
    </h3>
    {releases.length === 0 ? (
      <PanelMessage>Nothing has been released from escrow.</PanelMessage>
    ) : (
      <ul className="divide-y divide-border rounded-xl border border-border">
        {releases.map((release) => (
          <li
            key={release.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <span className="text-foreground">{release.reason}</span>
            <span className="whitespace-nowrap text-muted-foreground">
              {formatCurrency(release.amount)} · {formatDate(release.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    )}
  </LandCaseSection>
);
