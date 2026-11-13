'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Search, ShieldCheck, ShieldAlert } from '@sureground/icons';
import { Badge, Button, type BadgeVariant } from '@sureground/ui';
import { cn, formatRelativeTime } from '@sureground/shared';
import type { FraudAlert, FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';
import { roleLabel } from '@/lib/roleLabels';
import { fraudAlertSummary } from '@/lib/fraudAlertText';
import { IconTile } from '@/components/admin/ops/OpsParts';

const severityConfig: Record<
  FraudAlertSeverity,
  { label: string; variant: BadgeVariant; tone: 'neutral' | 'warning' | 'danger' }
> = {
  low: { label: 'Low', variant: 'neutral', tone: 'neutral' },
  medium: { label: 'Medium', variant: 'warning', tone: 'warning' },
  high: { label: 'High', variant: 'warning', tone: 'warning' },
  critical: { label: 'Critical', variant: 'danger', tone: 'danger' },
};

const statusConfig: Record<
  FraudAlertStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  flagged: { label: 'Flagged', icon: AlertTriangle, variant: 'danger' },
  investigating: { label: 'Investigating', icon: Search, variant: 'info' },
  cleared: { label: 'Cleared', icon: ShieldCheck, variant: 'success' },
  confirmed: { label: 'Confirmed', icon: ShieldAlert, variant: 'danger' },
};

interface FraudAlertCardProps {
  alert: FraudAlert;
  delay?: number;
  onOpen?: () => void;
  onInvestigate: () => void;
  onClear: () => void;
  onConfirm: () => void;
}

export const FraudAlertCard = ({
  alert,
  delay = 0,
  onOpen,
  onInvestigate,
  onClear,
  onConfirm,
}: FraudAlertCardProps) => {
  const severity = severityConfig[alert.severity];
  const status = statusConfig[alert.status];
  const StatusIcon = status.icon;
  const isDecided = alert.status === 'cleared' || alert.status === 'confirmed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      // A click anywhere opens the alert for pointer users; keyboard and screen-reader users get the
      // Details button below, because a role="button" card cannot contain the decision buttons.
      onClick={onOpen}
      className={cn(
        'flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition-[border-color,box-shadow] duration-200',
        alert.severity === 'critical' && !isDecided && 'border-destructive/30',
        onOpen ? 'cursor-pointer hover:border-primary/30 hover:shadow-md' : ''
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconTile tone={isDecided ? 'neutral' : severity.tone}>
            <AlertTriangle />
          </IconTile>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{alert.subjectName}</h3>
            <p className="text-xs text-muted-foreground truncate">{roleLabel(alert.subjectRole)}</p>
          </div>
        </div>
        <Badge variant={severity.variant} dot>
          {severity.label}
        </Badge>
      </div>

      <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
        {fraudAlertSummary(alert)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <Badge variant={status.variant} icon={<StatusIcon className="h-3 w-3" />}>
          {status.label}
        </Badge>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatRelativeTime(alert.detectedAt)}
        </span>
      </div>

      {onOpen ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full"
          aria-label={`Details of the alert on ${alert.subjectName}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Details
        </Button>
      ) : null}

      {!isDecided && (
        <div className="flex gap-2 mt-3">
          {alert.status === 'flagged' && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onInvestigate();
              }}
            >
              Investigate
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-success"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
          >
            Confirm
          </Button>
        </div>
      )}
    </motion.div>
  );
};
