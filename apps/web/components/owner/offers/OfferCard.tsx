'use client';

import { motion } from 'framer-motion';
import { Wallet, CreditCard, Banknote } from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { formatAskingDifference, formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  RecordActions,
  RecordAvatar,
  RecordFacts,
  recordCardClass,
} from '@/components/shared/records/RecordParts';
import { offerStatusBadges } from '@/lib/statusBadge';
import type { SaleOffer, FinancingType } from '@/types/owner';

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

interface OfferCardProps {
  offer: SaleOffer;
  onClick: () => void;
  delay?: number;
}

export const OfferCard = ({ offer, onClick, delay = 0 }: OfferCardProps) => {
  // Countered by the owner is still open, but it is the buyer's move.
  const needsOwner =
    offer.awaiting !== undefined
      ? offer.awaiting === 'owner'
      : offer.status === 'submitted' || offer.status === 'countered';
  const status = offerStatusBadges[offer.status];
  const FinancingIcon = financingIcons[offer.financingType];
  const diffPct = ((offer.offerAmount - offer.askingPrice) / offer.askingPrice) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(recordCardClass(), 'relative focus-within:ring-2 focus-within:ring-ring')}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open offer from ${offer.buyerName}`}
        className="absolute inset-0 z-10 rounded-2xl focus:outline-none"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RecordAvatar name={offer.buyerName} />
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{offer.buyerName}</h3>
            <p className="text-xs text-muted-foreground truncate">{offer.propertyName}</p>
          </div>
        </div>
        <Badge variant={status.variant} icon={status.icon && <status.icon className="w-3 h-3" />}>
          {status.label}
        </Badge>
      </div>

      <RecordFacts
        facts={[
          {
            label: 'Offer amount',
            value: (
              <>
                {formatCurrency(offer.offerAmount, { compact: true })}
                <span
                  className={`ml-1.5 text-xs font-medium ${diffPct >= 0 ? 'text-success' : 'text-destructive'}`}
                >
                  {formatAskingDifference(diffPct)}
                </span>
              </>
            ),
            tone: 'brand',
          },
          {
            label: 'Financing',
            value: (
              <span className="flex items-center gap-1.5">
                <FinancingIcon className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                {financingLabels[offer.financingType]}
              </span>
            ),
          },
        ]}
      />

      <RecordActions className="flex-nowrap justify-between gap-3">
        <p className="text-xs text-muted-foreground">Submitted {formatDate(offer.submittedAt)}</p>
        <Button
          variant={needsOwner ? 'primary' : 'outline'}
          size="sm"
          className="relative z-20"
          onClick={onClick}
        >
          {needsOwner ? 'Respond' : offer.awaiting === 'buyer' ? "Buyer's turn" : 'View'}
        </Button>
      </RecordActions>
    </motion.div>
  );
};
