'use client';

import { motion } from 'framer-motion';
import { Gavel, Clock, Search, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Dispute, DisputeStatus } from '@/types/admin';

const statusConfig: Record<
  DisputeStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  open: {
    label: 'Open',
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  under_review: {
    label: 'Under Review',
    icon: Search,
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  escalated: {
    label: 'Escalated',
    icon: ArrowUpCircle,
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

const priorityConfig: Record<Dispute['priority'], string> = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-muted-foreground',
};

interface DisputeCardProps {
  dispute: Dispute;
  onClick: () => void;
  delay?: number;
}

export const DisputeCard = ({ dispute, onClick, delay = 0 }: DisputeCardProps) => {
  const status = statusConfig[dispute.status];
  const StatusIcon = status.icon;

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
          <div className="p-2.5 rounded-xl bg-accent shrink-0">
            <Gavel className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{dispute.title}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {dispute.raisedBy} vs. {dispute.against}
            </p>
          </div>
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
          <p className="text-xs text-gray-400">Priority</p>
          <p className={`text-sm font-medium capitalize ${priorityConfig[dispute.priority]}`}>
            {dispute.priority}
          </p>
        </div>
        {dispute.amount !== undefined && (
          <div>
            <p className="text-xs text-gray-400">Amount</p>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(dispute.amount, { compact: true })}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-border">
        Opened {formatDate(dispute.createdAt)}
      </p>
    </motion.div>
  );
};
