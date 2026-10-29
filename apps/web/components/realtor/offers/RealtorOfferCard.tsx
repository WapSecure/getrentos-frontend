'use client';

import { Clock, RefreshCcw, CheckCircle2, XCircle, Archive, Undo2, Hourglass } from 'lucide-react';
import { Badge, Card, type BadgeVariant } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { RealtorOffer, RealtorOfferStatus } from '@/types/realtor';

const statusConfig: Record<
  RealtorOfferStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  submitted: { label: 'Submitted', icon: Clock, variant: 'warning' },
  countered: { label: 'Countered', icon: RefreshCcw, variant: 'info' },
  accepted: { label: 'Accepted', icon: CheckCircle2, variant: 'success' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'danger' },
  withdrawn: { label: 'Withdrawn', icon: Undo2, variant: 'neutral' },
  expired: { label: 'Expired', icon: Hourglass, variant: 'neutral' },
  closed: { label: 'Closed', icon: Archive, variant: 'neutral' },
};

interface RealtorOfferCardProps {
  offer: RealtorOffer;
  onClick: () => void;
  delay?: number;
}

export const RealtorOfferCard = ({ offer, onClick }: RealtorOfferCardProps) => {
  const status = statusConfig[offer.status] ?? statusConfig.closed;
  const StatusIcon = status.icon;
  const diffPct =
    offer.askingPrice > 0
      ? ((offer.offerAmount - offer.askingPrice) / offer.askingPrice) * 100
      : null;

  return (
    <Card interactive className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            <button
              type="button"
              onClick={onClick}
              className="text-left after:absolute after:inset-0 focus:outline-none"
            >
              {offer.listingTitle}
            </button>
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {offer.leadName} → {offer.clientName}
          </p>
        </div>
        <Badge
          variant={status.variant}
          icon={<StatusIcon className="w-3 h-3" />}
          className="shrink-0 whitespace-nowrap"
        >
          {status.label}
        </Badge>
      </div>

      <div className="mt-4">
        <p className="text-xs text-muted-foreground">Offer Amount</p>
        <p className="text-sm font-bold text-foreground">
          {formatCurrency(offer.offerAmount, { compact: true })}
        </p>
        <p
          className={`text-xs ${diffPct !== null && diffPct >= 0 ? 'text-success' : 'text-destructive'}`}
        >
          {diffPct === null ? '—' : `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}% vs asking`}
        </p>
      </div>

      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        Submitted {formatDate(offer.submittedAt)}
      </p>
    </Card>
  );
};
