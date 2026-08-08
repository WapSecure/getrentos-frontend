'use client';

import { motion } from 'framer-motion';
import { Clock, RefreshCcw, CheckCircle2, XCircle, Archive } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { RealtorOffer, RealtorOfferStatus } from '@/types/realtor';

const statusConfig: Record<
  RealtorOfferStatus,
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

interface RealtorOfferCardProps {
  offer: RealtorOffer;
  onClick: () => void;
  delay?: number;
}

export const RealtorOfferCard = ({ offer, onClick, delay = 0 }: RealtorOfferCardProps) => {
  const status = statusConfig[offer.status];
  const StatusIcon = status.icon;
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
            {offer.listingTitle}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {offer.leadName} → {offer.clientName}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${status.className}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-400">Offer Amount</p>
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

      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
        Submitted {formatDate(offer.submittedAt)}
      </p>
    </motion.div>
  );
};
