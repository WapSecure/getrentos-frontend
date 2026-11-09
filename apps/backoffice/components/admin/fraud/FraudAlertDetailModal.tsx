'use client';

import { humaniseEnum } from '@sureground/shared';
import { AlertTriangle, RotateCcw, Search, ShieldCheck, ShieldAlert } from '@sureground/icons';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Select,
  Skeleton,
  Badge,
  type BadgeVariant,
} from '@sureground/ui';
import { EvidencePanel } from '@/components/shared/EvidencePanel';
import type {
  FraudAlertAiSignal,
  FraudAlertDetail,
  FraudAlertSeverity,
  FraudAlertStatus,
} from '@/types/admin';

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
  onAttachEvidence?: (file: File, note?: string) => void;
  canAttachEvidence?: boolean;
  isAttachingEvidence?: boolean;
  onResolveEvidenceUrl?: (evidenceId: string) => Promise<string | null | undefined>;
}

export const FraudAlertDetailModal = ({
  alert,
  loading = false,
  onClose,
  onSeverityChange,
  onStatusChange,
  onReopen,
  isUpdating = false,
  onAttachEvidence,
  canAttachEvidence = false,
  isAttachingEvidence = false,
  onResolveEvidenceUrl,
}: FraudAlertDetailModalProps) => {
  if (!alert) return null;

  const severity = SEVERITY_CONFIG[alert.severity];
  const status = STATUS_CONFIG[alert.status];
  const StatusIcon = status.icon;
  const isTerminal = alert.status === 'cleared' || alert.status === 'confirmed';
  const isActive = alert.status === 'flagged' || alert.status === 'investigating';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden flex flex-col p-0">
        <div className="p-4 border-b border-border shrink-0 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-foreground truncate">
                {alert.subject.legalName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {humaniseEnum(alert.subject.role)}
                {alert.subject.email ? ` · ${alert.subject.email}` : ''}
                {alert.subject.isVerified ? ' · verified' : ' · unverified'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={severity.variant}>{alert.severity}</Badge>
              <Badge variant="neutral" icon={<StatusIcon className="w-3.5 h-3.5" />}>
                {status.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading alert detail">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <>
              <div>
                <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Reason
                </p>
                <p className="text-sm text-foreground mt-0.5">{alert.reason}</p>
              </div>

              {alert.aiSignal && <AiScanPanel signal={alert.aiSignal} />}

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground rounded-lg bg-secondary/40 p-3">
                {alert.subject.phone && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Phone:</span>{' '}
                    {alert.subject.phone}
                  </p>
                )}
                <p className="truncate">
                  <span className="font-medium text-foreground">Role:</span>{' '}
                  <span>{humaniseEnum(alert.subject.role)}</span>
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

              <EvidencePanel
                evidence={alert.evidence ?? []}
                canAttach={canAttachEvidence}
                isAttaching={isAttachingEvidence}
                onAttach={onAttachEvidence}
                onResolveUrl={onResolveEvidenceUrl}
                emptyHint="No evidence attached. A reason is a claim; attach what backs it up."
              />
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
                  className="flex-1 text-success"
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
                  className="flex-1 text-destructive"
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

const COVERAGE_LABELS: Record<string, string> = {
  textAndMetadata: 'Text and details',
  crossListingDuplicates: 'Copies of other listings',
  photoReuse: 'Reused photos',
  imageAnalysis: 'Photo content',
};

function AiScanPanel({ signal }: { signal: FraudAlertAiSignal }) {
  const missed = Object.entries(signal.coverage).filter(([, checked]) => !checked);
  return (
    <section className="space-y-3 rounded-lg border border-border/70 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wide">
          Automated scan · {signal.source === 'ai' ? 'model' : 'rule-based check'}
        </p>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {signal.riskScore}/100 · {signal.band.toLowerCase()} risk
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        A signal, not a verdict. Check the evidence before clearing or confirming.
      </p>

      {signal.reasons.length > 0 && (
        <ul className="space-y-1.5">
          {signal.reasons.map((r) => (
            <li key={r.code} className="text-sm">
              <span className="font-medium text-foreground">
                {r.code.replace(/_/g, ' ').toLowerCase()}
              </span>
              <span className="text-muted-foreground"> ({r.severity.toLowerCase()}): </span>
              <span className="text-foreground">{r.detail}</span>
            </li>
          ))}
        </ul>
      )}

      {signal.duplicates.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">
            Matches another owner&apos;s listing ({signal.duplicates.length})
          </p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {signal.duplicates.map((d) => (
              <li key={d.listingId}>
                {d.title ?? 'Untitled listing'}
                {d.city ? `, ${d.city}` : ''} · {Math.round(d.similarity * 100)}% similar · #
                {d.listingId.slice(0, 8)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {signal.photoReuse.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">
            Photos also uploaded by another owner ({signal.photoReuse.length})
          </p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {signal.photoReuse.map((p, i) => (
              <li key={`${p.otherListingId ?? p.otherPropertyId ?? 'x'}-${i}`}>
                {p.matchType === 'EXACT' ? 'Identical photo' : 'Near copy'} on{' '}
                {p.otherListingId
                  ? `listing #${p.otherListingId.slice(0, 8)}`
                  : `property #${(p.otherPropertyId ?? '').slice(0, 8)}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {signal.recommendation && (
        <p className="text-sm text-foreground">
          <span className="font-medium">Suggested next step: </span>
          {signal.recommendation}
        </p>
      )}

      {missed.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Not checked: {missed.map(([k]) => COVERAGE_LABELS[k] ?? k).join(', ')}. A low score does
          not clear what was not looked at.
        </p>
      )}
    </section>
  );
}
