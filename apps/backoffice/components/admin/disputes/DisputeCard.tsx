'use client';

import { motion } from 'framer-motion';
import { Gavel, Clock, Search, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import type { Dispute, DisputeStatus } from '@/types/admin';

const statusConfig: Record<
  DisputeStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  open: { label: 'Open', icon: Clock, variant: 'warning' },
  under_review: { label: 'Under Review', icon: Search, variant: 'info' },
  resolved: { label: 'Resolved', icon: CheckCircle2, variant: 'success' },
  escalated: { label: 'Escalated', icon: ArrowUpCircle, variant: 'danger' },
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
      className="cursor-pointer rounded-2xl border border-border/90 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
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
        <Badge variant={status.variant} icon={<StatusIcon className="h-3 w-3" />}>
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">Priority</p>
          <p className={`text-sm font-medium capitalize ${priorityConfig[dispute.priority]}`}>
            {dispute.priority}
          </p>
        </div>
        {dispute.amount !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(dispute.amount, { compact: true })}
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        Opened {formatDate(dispute.createdAt)}
      </p>
    </motion.div>
  );
};
