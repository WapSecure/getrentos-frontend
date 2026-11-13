'use client';

import { motion } from 'framer-motion';
import {
  Handshake,
  Wallet,
  CreditCard,
  Banknote,
  Clock,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Archive,
} from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { formatCurrency, formatDate, formatAskingDifference } from '@/lib/format';
import type { BuyerOffer, BuyerOfferStatus, FinancingType } from '@/types/buyer';
import { RecordIconTile, recordCardClass } from '@/components/shared/records/RecordParts';

const statusConfig: Record<
  BuyerOfferStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  submitted: {
    label: 'Submitted',
    icon: Clock,
    variant: 'warning',
  },
  countered: {
    label: 'Countered',
    icon: RefreshCcw,
    variant: 'info',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    variant: 'success',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'danger',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: XCircle,
    variant: 'neutral',
  },
  expired: {
    label: 'Expired',
    icon: Archive,
    variant: 'neutral',
  },
  closed: {
    label: 'Closed',
    icon: Archive,
    variant: 'neutral',
  },
};

const financingIcons: Record<FinancingType, React.ElementType> = {
  cash: Wallet,
  mortgage: Banknote,
  installment: CreditCard,
};

const financingLabels: Record<FinancingType, string> = {
  cash: 'Cash',
  mortgage: 'Mortgage',
  installment: 'Instalment',
};

interface BuyerOfferCardProps {
  offer: BuyerOffer;
  onClick: () => void;
  delay?: number;
}

export const BuyerOfferCard = ({ offer, onClick, delay = 0 }: BuyerOfferCardProps) => {
  const status = statusConfig[offer.status];
  const StatusIcon = status.icon;
  const FinancingIcon = financingIcons[offer.financingType];
  const diffPct = ((offer.offerAmount - offer.askingPrice) / offer.askingPrice) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${recordCardClass()}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RecordIconTile icon={Handshake} />
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
              {offer.propertyTitle}
            </h3>
            <p className="text-xs text-muted-foreground truncate">Owner: {offer.ownerName}</p>
          </div>
        </div>
        <Badge
          variant={status.variant}
          icon={<StatusIcon className="w-3 h-3" />}
          className="shrink-0"
        >
          {status.label}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-secondary/60 px-3.5 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Your offer</p>
          <p className="text-sm font-semibold tabular-nums text-primary">
            {formatCurrency(offer.offerAmount, { compact: true })}
          </p>
          <p className={`text-xs ${diffPct >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatAskingDifference(diffPct)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Financing</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <FinancingIcon className="w-3.5 h-3.5 text-muted-foreground" />
            {financingLabels[offer.financingType]}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        Submitted {formatDate(offer.submittedAt)}
      </p>
    </motion.div>
  );
};
