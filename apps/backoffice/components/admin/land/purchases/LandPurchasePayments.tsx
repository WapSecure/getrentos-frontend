import { Banknote, Check, RotateCcw } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import type {
  LandEscrowRelease,
  LandPurchasePayment,
  LandReleasePayoutStatus,
} from '@/types/landPurchase';
import { LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';
import { LandLineStatusBadge } from './LandPurchaseStatusBadge';

const PAYOUT_STATUS: Record<
  LandReleasePayoutStatus,
  { label: string; variant: 'info' | 'success' | 'danger' | 'warning' | 'neutral' }
> = {
  AWAITING_APPROVAL: { label: 'Needs approval', variant: 'warning' },
  PENDING: { label: 'Queued for payout', variant: 'neutral' },
  PROCESSING: { label: 'Transfer sent', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Payout failed', variant: 'danger' },
};

/**
 * Money in (buyer payments) and money out (releases to the developer, and
 * whether each has reached their bank). Finance approves large payouts and
 * retries failed ones here.
 */
export const LandPurchasePayments = ({
  payments,
  releases,
  canAct = false,
  busyReleaseId = null,
  onApprove,
  onRetry,
}: {
  payments: LandPurchasePayment[];
  releases: LandEscrowRelease[];
  /** Holds `escrow.approve`. */
  canAct?: boolean;
  busyReleaseId?: string | null;
  onApprove?: (releaseId: string) => void;
  onRetry?: (releaseId: string) => void;
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
      Releases to the developer
    </h3>
    {releases.length === 0 ? (
      <PanelMessage>Nothing has been released to the developer.</PanelMessage>
    ) : (
      <ul className="divide-y divide-border rounded-xl border border-border">
        {releases.map((release) => {
          const payout = release.payoutStatus ? PAYOUT_STATUS[release.payoutStatus] : null;
          const busy = busyReleaseId === release.id;
          return (
            <li
              key={release.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="text-foreground">{release.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(release.amount)} · released {formatDate(release.createdAt)}
                  {release.paidAt ? ` · paid ${formatDate(release.paidAt)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {payout && <Badge variant={payout.variant}>{payout.label}</Badge>}
                {canAct && release.payoutStatus === 'AWAITING_APPROVAL' && onApprove && (
                  <Button
                    size="xs"
                    variant="outline"
                    isLoading={busy}
                    disabled={Boolean(busyReleaseId)}
                    onClick={() => onApprove(release.id)}
                    icon={<Check className="h-3.5 w-3.5" />}
                  >
                    Approve payout
                  </Button>
                )}
                {canAct && release.payoutStatus === 'FAILED' && onRetry && (
                  <Button
                    size="xs"
                    variant="outline"
                    isLoading={busy}
                    disabled={Boolean(busyReleaseId)}
                    onClick={() => onRetry(release.id)}
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                  >
                    Retry payout
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </LandCaseSection>
);
