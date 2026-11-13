'use client';

import { motion } from 'framer-motion';
import { Gavel, Clock, Search, CheckCircle2, ArrowUpCircle } from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { codeLabel, formatCurrency, formatDate } from '@sureground/shared';
import type { Dispute, DisputeStatus } from '@/types/admin';
import { FactGrid, IconTile } from '@/components/admin/ops/OpsParts';

const statusConfig: Record<
  DisputeStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  open: { label: 'Open', icon: Clock, variant: 'warning' },
  under_review: { label: 'Under review', icon: Search, variant: 'info' },
  resolved: { label: 'Resolved', icon: CheckCircle2, variant: 'success' },
  escalated: { label: 'Escalated', icon: ArrowUpCircle, variant: 'danger' },
};

const priorityConfig: Record<Dispute['priority'], BadgeVariant> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
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
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="flex min-w-0 w-full max-w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card p-5 text-left shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconTile>
            <Gavel />
          </IconTile>
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

      <FactGrid
        className="mt-4 w-full flex-1"
        facts={[
          {
            label: 'Priority',
            value: (
              <Badge variant={priorityConfig[dispute.priority]} dot>
                {codeLabel(dispute.priority)}
              </Badge>
            ),
          },
          dispute.amount !== undefined && {
            label: 'Amount',
            value: (
              <span className="tabular-nums">
                {formatCurrency(dispute.amount, { compact: true })}
              </span>
            ),
          },
        ]}
      />

      <p className="mt-4 w-full border-t border-border pt-3 text-xs text-muted-foreground">
        Opened {formatDate(dispute.createdAt)}
      </p>
    </motion.button>
  );
};
