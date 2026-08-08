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
import { formatCurrency, formatDate } from '@/lib/format';
import type { BuyerOffer, BuyerOfferStatus, FinancingType } from '@/types/buyer';

const statusConfig: Record<
  BuyerOfferStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  submitted: {
    label: 'Submitted',
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  countered: {
    label: 'Countered',
    icon: RefreshCcw,
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
  closed: {
    label: 'Closed',
    icon: Archive,
    className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
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
      className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {offer.propertyTitle}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Owner: {offer.ownerName}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${status.className}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-gray-400">Your Offer</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
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
          <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
            <FinancingIcon className="w-3.5 h-3.5 text-gray-400" />
            {financingLabels[offer.financingType]}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
        Submitted {formatDate(offer.submittedAt)}
      </p>
    </motion.div>
  );
};
