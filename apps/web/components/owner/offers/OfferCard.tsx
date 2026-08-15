'use client';

import { motion } from 'framer-motion';
import { Wallet, CreditCard, Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, getInitials } from '@/lib/format';
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
  const status = offerStatusBadges[offer.status];
  const FinancingIcon = financingIcons[offer.financingType];
  const diffPct = ((offer.offerAmount - offer.askingPrice) / offer.askingPrice) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="bg-card rounded-2xl border border-border p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
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
          <p className="text-xs text-gray-400">Offer Amount</p>
          <p className="text-sm font-bold text-foreground">
            {formatCurrency(offer.offerAmount, { compact: true })}
          </p>
          <p
            className={`text-xs ${diffPct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {diffPct >= 0 ? '+' : ''}
            {diffPct.toFixed(1)}% vs asking
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Financing</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <FinancingIcon className="w-3.5 h-3.5 text-gray-400" />
            {financingLabels[offer.financingType]}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-border">
        Submitted {formatDate(offer.submittedAt)}
      </p>
    </motion.div>
  );
};
