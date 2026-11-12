'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Search, ShieldCheck, ShieldAlert } from '@sureground/icons';
import { Badge, Button, type BadgeVariant } from '@sureground/ui';
import { cn, formatRelativeTime } from '@sureground/shared';
import type { FraudAlert, FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';
import { roleLabel } from '@/lib/roleLabels';
import { fraudAlertSummary } from '@/lib/fraudAlertText';

const severityConfig: Record<FraudAlertSeverity, { label: string; variant: BadgeVariant }> = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
};

const statusConfig: Record<
  FraudAlertStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  flagged: { label: 'Flagged', icon: AlertTriangle, className: 'text-destructive' },
  investigating: {
    label: 'Investigating',
    icon: Search,
    className: 'text-info',
  },
  cleared: { label: 'Cleared', icon: ShieldCheck, className: 'text-success' },
  confirmed: { label: 'Confirmed', icon: ShieldAlert, className: 'text-destructive' },
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
        'rounded-2xl border border-border/90 bg-card p-4 shadow-sm transition-shadow duration-300',
        onOpen ? 'cursor-pointer hover:shadow-md' : ''
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-destructive-subtle shrink-0">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{alert.subjectName}</h3>
            <p className="text-xs text-muted-foreground truncate">{roleLabel(alert.subjectRole)}</p>
          </div>
        </div>
        <Badge variant={severity.variant}>{severity.label}</Badge>
      </div>

      <p className="text-sm text-muted-foreground mt-3">{fraudAlertSummary(alert)}</p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>
        <span className="text-xs text-muted-foreground">
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
