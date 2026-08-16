'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatRelativeTime } from '@/lib/format';
import type { FraudAlert, FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';

const severityConfig: Record<FraudAlertSeverity, { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-white/10' },
  medium: {
    label: 'Medium',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  high: {
    label: 'High',
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  critical: {
    label: 'Critical',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

const statusConfig: Record<
  FraudAlertStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  flagged: { label: 'Flagged', icon: AlertTriangle, className: 'text-red-600 dark:text-red-400' },
  investigating: {
    label: 'Investigating',
    icon: Search,
    className: 'text-blue-600 dark:text-blue-400',
  },
  cleared: { label: 'Cleared', icon: ShieldCheck, className: 'text-green-600 dark:text-green-400' },
  confirmed: { label: 'Confirmed', icon: ShieldAlert, className: 'text-red-600 dark:text-red-400' },
};

interface FraudAlertCardProps {
  alert: FraudAlert;
  delay?: number;
  onInvestigate: () => void;
  onClear: () => void;
  onConfirm: () => void;
}

export const FraudAlertCard = ({
  alert,
  delay = 0,
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
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{alert.subjectName}</h3>
            <p className="text-xs text-muted-foreground truncate capitalize">{alert.subjectRole}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${severity.className}`}
        >
          {severity.label}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mt-3">{alert.reason}</p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>
        <span className="text-xs text-gray-400">{formatRelativeTime(alert.detectedAt)}</span>
      </div>

      {!isDecided && (
        <div className="flex gap-2 mt-3">
          {alert.status === 'flagged' && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onInvestigate}>
              Investigate
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-green-600 dark:text-green-400"
            onClick={onClear}
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 dark:text-red-400"
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </div>
      )}
    </motion.div>
  );
};
