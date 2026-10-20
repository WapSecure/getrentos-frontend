'use client';

import { motion } from 'framer-motion';
import {
  Wallet,
  CreditCard,
  Banknote,
  Clock,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Archive,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { BuyerOffer, BuyerOfferStatus, FinancingType } from '@/types/buyer';

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
  installment: 'Installment',
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
      className="bg-card rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 border border-border p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{offer.propertyTitle}</h3>
          <p className="text-xs text-muted-foreground truncate">Owner: {offer.ownerName}</p>
        </div>
        <Badge variant={status.variant} icon={<StatusIcon className="w-3 h-3" />}>
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">Your Offer</p>
          <p className="text-sm font-bold text-foreground">
            {formatCurrency(offer.offerAmount, { compact: true })}
          </p>
          <p className={`text-xs ${diffPct >= 0 ? 'text-success' : 'text-destructive'}`}>
            {diffPct >= 0 ? '+' : ''}
            {diffPct.toFixed(1)}% vs asking
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
