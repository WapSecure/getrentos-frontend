'use client';

import { codeLabel, formatDateTime, humaniseEnum } from '@sureground/shared';
import { AlertTriangle, RotateCcw, Search, ShieldCheck, ShieldAlert } from '@sureground/icons';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Disclosure,
  Button,
  Select,
  Skeleton,
  Badge,
  type BadgeVariant,
} from '@sureground/ui';
import { EvidencePanel } from '@/components/shared/EvidencePanel';
import { FactGrid, IconTile } from '@/components/admin/ops/OpsParts';
import type {
  FraudAlertAiSignal,
  FraudAlertDetail,
  FraudAlertMediaReuse,
  FraudAlertSeverity,
  FraudAlertStatus,
} from '@/types/admin';
import { fraudAlertSummary, isStorageKey, matchedListingUrl } from '@/lib/fraudAlertText';

const SEVERITY_OPTIONS: { value: FraudAlertSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const SEVERITY_CONFIG: Record<
  FraudAlertSeverity,
  { variant: BadgeVariant; tone: 'neutral' | 'warning' | 'danger' }
> = {
  low: { variant: 'neutral', tone: 'neutral' },
  medium: { variant: 'warning', tone: 'warning' },
  high: { variant: 'warning', tone: 'warning' },
  critical: { variant: 'danger', tone: 'danger' },
};

const STATUS_CONFIG: Record<
  FraudAlertStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  flagged: { label: 'Flagged', icon: AlertTriangle, variant: 'danger' },
  investigating: { label: 'Investigating', icon: Search, variant: 'info' },
  cleared: { label: 'Cleared', icon: ShieldCheck, variant: 'success' },
  confirmed: { label: 'Confirmed', icon: ShieldAlert, variant: 'danger' },
};

const sectionLabel = 'text-2xs font-semibold uppercase tracking-wide text-muted-foreground';

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
  const summary = fraudAlertSummary(alert);
  const showRelated = !!alert.relatedEntityType && !isStorageKey(alert.relatedEntityId ?? '');

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="lg"
        padded={false}
        className="flex max-h-[88dvh] flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-border px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <IconTile tone={isTerminal ? 'neutral' : severity.tone}>
              <AlertTriangle />
            </IconTile>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate font-semibold tracking-[-0.01em] text-foreground">
                {alert.subject.legalName}
              </DialogTitle>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="capitalize">{humaniseEnum(alert.subject.role)}</span>
                {alert.subject.email ? ` · ${alert.subject.email}` : ''}
                {alert.subject.isVerified ? ' · verified' : ' · unverified'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant={severity.variant} dot>
                  {codeLabel(alert.severity)}
                </Badge>
                <Badge variant={status.variant} icon={<StatusIcon className="h-3 w-3" />}>
                  {status.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
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
                <p className={sectionLabel}>Reason</p>
                <p className="mt-1 text-sm leading-6 text-foreground">{summary}</p>
                {alert.mediaReuse && <MatchedPlace media={alert.mediaReuse} />}
              </div>

              <TechnicalDetails alert={alert} summary={summary} />

              {alert.aiSignal && <AiScanPanel signal={alert.aiSignal} />}

              <FactGrid
                className="rounded-lg border border-border bg-secondary/30 p-3"
                facts={[
                  { label: 'Role', value: humaniseEnum(alert.subject.role) },
                  !!alert.subject.phone && { label: 'Phone', value: alert.subject.phone },
                  { label: 'Detected', value: formatDateTime(alert.detectedAt) },
                  showRelated && {
                    label: 'Related',
                    value: `${codeLabel(alert.relatedEntityType)}${
                      alert.relatedEntityId ? ` #${alert.relatedEntityId.slice(0, 8)}` : ''
                    }`,
                  },
                  alert.resolvedBy && {
                    label: 'Resolved by',
                    value: `${alert.resolvedBy.legalName}${
                      alert.resolvedAt ? ` · ${formatDateTime(alert.resolvedAt)}` : ''
                    }`,
                    wide: true,
                  },
                ]}
              />

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

        <div className="shrink-0 space-y-3 border-t border-border bg-secondary/30 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Severity
            </p>
            <div className="w-40">
              <Select
                value={alert.severity}
                onValueChange={(value) => onSeverityChange(alert.id, value as FraudAlertSeverity)}
                options={SEVERITY_OPTIONS}
                ariaLabel="Severity"
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

function MatchedPlace({ media }: { media: FraudAlertMediaReuse }) {
  const listingUrl = matchedListingUrl(media.matchedListing);
  const place = media.matchedListing?.title ?? media.matchedProperty?.title;
  if (!place && !media.matchedOwner) return null;
  return (
    <p className="text-xs text-muted-foreground mt-1.5">
      {place && (
        <>
          Matched {media.matchedListing ? 'listing' : 'property'}:{' '}
          {listingUrl ? (
            <a
              href={listingUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              {place}
            </a>
          ) : (
            <span className="font-medium text-foreground">{place}</span>
          )}
        </>
      )}
      {media.matchedOwner && (
        <>
          {place ? ' · ' : ''}Owner:{' '}
          <span className="font-medium text-foreground">{media.matchedOwner.name}</span>
        </>
      )}
    </p>
  );
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  EXACT: 'Identical file or image',
  NEAR: 'Near copy (resized or recompressed)',
};

/** Collapsed by default: staff rarely need these, and they must never appear in lists or feeds. */
function TechnicalDetails({ alert, summary }: { alert: FraudAlertDetail; summary: string }) {
  const media = alert.mediaReuse;
  const rows: { label: string; value: string; mono?: boolean }[] = [];
  if (media) {
    if (media.matchType)
      rows.push({
        label: 'Match type',
        value: MATCH_TYPE_LABELS[media.matchType] ?? media.matchType,
      });
    if (media.distance !== null)
      rows.push({ label: 'Image difference', value: `${media.distance} of 64 bits` });
    if (media.matchCount !== null)
      rows.push({ label: 'Matches found', value: String(media.matchCount) });
    if (media.matchedListing)
      rows.push({ label: 'Matched listing ID', value: media.matchedListing.id, mono: true });
    if (media.matchedProperty)
      rows.push({ label: 'Matched property ID', value: media.matchedProperty.id, mono: true });
    if (media.storageKey)
      rows.push({ label: 'Uploaded file', value: media.storageKey, mono: true });
    if (media.matchedStorageKey)
      rows.push({ label: 'Matched file', value: media.matchedStorageKey, mono: true });
  }
  if (alert.relatedEntityId && isStorageKey(alert.relatedEntityId)) {
    rows.push({ label: 'Related file', value: alert.relatedEntityId, mono: true });
  }
  if (alert.reason !== summary) rows.push({ label: 'Recorded reason', value: alert.reason });
  if (rows.length === 0) return null;

  return (
    <Disclosure
      summary="Technical details"
      className="rounded-lg border border-border/70 [&>summary]:px-3 [&>summary]:py-2 [&>div]:px-3 [&>div]:pb-3"
    >
      <dl className="space-y-1.5 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[8.5rem_1fr] gap-2">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={`min-w-0 break-all text-foreground${row.mono ? ' font-mono' : ''}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Disclosure>
  );
}

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
              <span className="font-medium text-foreground">{codeLabel(r.code)}</span>
              <span className="text-muted-foreground">
                {' '}
                ({codeLabel(r.severity).toLowerCase()}):{' '}
              </span>
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
