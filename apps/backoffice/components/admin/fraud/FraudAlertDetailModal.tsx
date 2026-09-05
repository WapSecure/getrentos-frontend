'use client';

import { AlertTriangle, RotateCcw, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Select,
  Badge,
  type BadgeVariant,
} from '@getrentos/ui';
import type { FraudAlertDetail, FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';

const SEVERITY_OPTIONS: { value: FraudAlertSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const SEVERITY_CONFIG: Record<FraudAlertSeverity, { variant: BadgeVariant }> = {
  low: { variant: 'neutral' },
  medium: { variant: 'warning' },
  high: { variant: 'warning' },
  critical: { variant: 'danger' },
};

const STATUS_CONFIG: Record<FraudAlertStatus, { label: string; icon: React.ElementType }> = {
  flagged: { label: 'Flagged', icon: AlertTriangle },
  investigating: { label: 'Investigating', icon: Search },
  cleared: { label: 'Cleared', icon: ShieldCheck },
  confirmed: { label: 'Confirmed', icon: ShieldAlert },
};

interface FraudAlertDetailModalProps {
  alert: FraudAlertDetail | null;
  loading?: boolean;
  onClose: () => void;
  onSeverityChange: (id: string, severity: FraudAlertSeverity) => void;
  onStatusChange: (id: string, status: 'investigating' | 'cleared' | 'confirmed') => void;
  onReopen: (id: string) => void;
  isUpdating?: boolean;
}

export const FraudAlertDetailModal = ({
  alert,
  loading = false,
  onClose,
  onSeverityChange,
  onStatusChange,
  onReopen,
  isUpdating = false,
}: FraudAlertDetailModalProps) => {
  if (!alert) return null;

  const severity = SEVERITY_CONFIG[alert.severity];
  const status = STATUS_CONFIG[alert.status];
  const StatusIcon = status.icon;
  const isTerminal = alert.status === 'cleared' || alert.status === 'confirmed';
  const isActive = alert.status === 'flagged' || alert.status === 'investigating';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border shrink-0 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-foreground truncate">
                {alert.subject.legalName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {alert.subject.role}
                {alert.subject.email ? ` · ${alert.subject.email}` : ''}
                {alert.subject.isVerified ? ' · verified' : ' · unverified'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={severity.variant}>{alert.severity}</Badge>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-foreground">
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading alert detail…</p>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Reason
                </p>
                <p className="text-sm text-foreground mt-0.5">{alert.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground rounded-lg bg-secondary/40 p-3">
                {alert.subject.phone && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Phone:</span>{' '}
                    {alert.subject.phone}
                  </p>
                )}
                <p className="truncate">
                  <span className="font-medium text-foreground">Role:</span>{' '}
                  <span className="capitalize">{alert.subject.role}</span>
                </p>
                {alert.relatedEntityType && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Related:</span>{' '}
                    {alert.relatedEntityType}
                    {alert.relatedEntityId ? ` #${alert.relatedEntityId.slice(0, 8)}` : ''}
                  </p>
                )}
                <p className="truncate">
                  <span className="font-medium text-foreground">Detected:</span>{' '}
                  {new Date(alert.detectedAt).toLocaleString()}
                </p>
                {alert.resolvedBy && (
                  <p className="truncate col-span-2">
                    <span className="font-medium text-foreground">Resolved by:</span>{' '}
                    {alert.resolvedBy.legalName}
                    {alert.resolvedAt ? ` · ${new Date(alert.resolvedAt).toLocaleString()}` : ''}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Severity
            </p>
            <div className="w-40">
              <Select
                value={alert.severity}
                onValueChange={(value) => onSeverityChange(alert.id, value as FraudAlertSeverity)}
                options={SEVERITY_OPTIONS}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {isActive && (
              <>
                {alert.status === 'flagged' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    isLoading={isUpdating}
                    disabled={isUpdating}
                    onClick={() => onStatusChange(alert.id, 'investigating')}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Investigate
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-green-600 dark:text-green-400"
                  isLoading={isUpdating}
                  disabled={isUpdating}
                  onClick={() => onStatusChange(alert.id, 'cleared')}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 dark:text-red-400"
                  isLoading={isUpdating}
                  disabled={isUpdating}
                  onClick={() => onStatusChange(alert.id, 'confirmed')}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Confirm
                </Button>
              </>
            )}
            {isTerminal && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                isLoading={isUpdating}
                disabled={isUpdating}
                onClick={() => onReopen(alert.id)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reopen into review
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
