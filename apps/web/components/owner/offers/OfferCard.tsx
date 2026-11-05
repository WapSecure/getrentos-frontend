'use client';

import { motion } from 'framer-motion';
import { Wallet, CreditCard, Banknote } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { formatAskingDifference, formatCurrency, formatDate, getInitials } from '@/lib/format';
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
  installment: 'Installment',
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
      className="relative rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open offer from ${offer.buyerName}`}
        className="absolute inset-0 z-10 rounded-2xl focus:outline-none"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {getInitials(offer.buyerName)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{offer.buyerName}</h3>
            <p className="text-xs text-muted-foreground truncate">{offer.propertyName}</p>
          </div>
        </div>
        <Badge variant={status.variant} icon={status.icon && <status.icon className="w-3 h-3" />}>
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">Offer amount</p>
          <p className="text-sm font-bold text-foreground">
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

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Submitted {formatDate(offer.submittedAt)}</p>
        {/* The whole card opens the offer, but a card alone does not say so:
            the button is the visible way in, and names the decision waiting. */}
        <Button
          variant={needsOwner ? 'primary' : 'outline'}
          size="sm"
          className="relative z-20"
          onClick={onClick}
        >
          {needsOwner ? 'Respond' : offer.awaiting === 'buyer' ? "Buyer's turn" : 'View'}
        </Button>
      </div>
    </motion.div>
  );
};
