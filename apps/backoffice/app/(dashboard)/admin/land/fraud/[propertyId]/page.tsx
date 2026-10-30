'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, Gauge, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  Badge,
  Button,
  CardSkeleton,
  EmptyState,
  PageErrorState,
  Skeleton,
  Textarea,
  useToast,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { landQueryKeys, readLandApiError } from '@/lib/landDiligence';
import {
  adminLandFraudService,
  bandTone,
  LAND_FRAUD_SIGNAL_LABELS,
  representativeLinkText,
  severityTone,
  type LandFraudAssessment,
  type LandFraudSignal,
} from '@/services/adminLandFraudService';
import { LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';

/** One parcel's fraud picture: the score, what made it up, and each signal to decide. */
export default function AdminLandFraudParcelPage() {
  const params = useParams<{ propertyId: string }>();
  const propertyId = decodeURIComponent(params.propertyId);
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'fraud.review');
  const toast = useToast();
  const key = landQueryKeys.fraudParcel(propertyId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => unwrap(adminLandFraudService.assessment(propertyId)),
    enabled: canView,
  });
  const done = (a: LandFraudAssessment, message: string) => {
    queryClient.setQueryData(key, a);
    void queryClient.invalidateQueries({ queryKey: landQueryKeys.fraudRoot });
    toast.success(message);
  };
  const failed = (e: unknown, fallback: string) =>
    toast.error(readLandApiError(e, fallback).message);
  const rescan = useMutation({
    mutationFn: () => unwrap(adminLandFraudService.rescan(propertyId)),
    onSuccess: (a) => done(a, 'Rescanned.'),
    onError: (e) => failed(e, 'Could not rescan.'),
  });

  if (!canView)
    return <EmptyState icon={CircleAlert} title="You do not have access to fraud signals" />;
  if (query.isLoading) return <ParcelSkeleton />;
  const a = query.data;
  if (!a) {
    return (
      <PageErrorState
        title="This parcel could not be loaded"
        description={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }
  const live = a.signals.filter((s) => s.status !== 'CLEARED');
  const cleared = a.signals.filter((s) => s.status === 'CLEARED');

  return (
    <>
      <Link
        href="/admin/land/fraud"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Land fraud signals
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="type-title">{a.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {a.seller.name} · {a.city}, {a.state} ·{' '}
            <Link
              href={`/admin/land/diligence/${encodeURIComponent(a.propertyId)}`}
              className="text-primary hover:underline"
            >
              Diligence case
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {a.blocking && (
            <Badge variant="danger" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
              Blocks approval
            </Badge>
          )}
          <Badge variant={bandTone(a.band)}>Score {a.score}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => rescan.mutate()}
            isLoading={rescan.isPending}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Rescan
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <LandCaseSection
            title="Signals"
            icon={ShieldAlert}
            description="Clear one that has an innocent explanation; confirm one that does not."
          >
            {live.length === 0 ? (
              <PanelMessage>No signals are open.</PanelMessage>
            ) : (
              <ul className="space-y-3">
                {live.map((s) => (
                  <SignalItem key={s.id} signal={s} onDone={done} onFailed={failed} />
                ))}
              </ul>
            )}
            {cleared.length > 0 && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  {cleared.length} cleared
                </summary>
                <ul className="mt-2 space-y-2">
                  {cleared.map((s) => (
                    <li key={s.id} className="text-muted-foreground">
                      {LAND_FRAUD_SIGNAL_LABELS[s.code]} · {s.resolvedBy ?? 'automatically'}
                      {s.resolvedAt && ` · ${formatDate(s.resolvedAt)}`}: {s.resolutionNote}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </LandCaseSection>
        </div>
        <LandCaseSection title="What makes up the score" icon={Gauge}>
          {a.contributions.length === 0 ? (
            <PanelMessage>Nothing counts against this parcel.</PanelMessage>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {a.contributions.map((c, i) => (
                <li key={`${c.source}-${i}`} className="flex justify-between gap-3">
                  <span className="text-foreground">{c.source}</span>
                  <span className="font-mono text-muted-foreground">+{c.points}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 border-t border-border pt-1.5 font-medium">
                <span>Score (capped at 100)</span>
                <span className="font-mono">{a.score}</span>
              </li>
            </ul>
          )}
        </LandCaseSection>
      </div>
    </>
  );
}

function SignalItem({
  signal: s,
  onDone,
  onFailed,
}: {
  signal: LandFraudSignal;
  onDone: (a: LandFraudAssessment, m: string) => void;
  onFailed: (e: unknown, f: string) => void;
}) {
  const [note, setNote] = useState('');
  const decide = useMutation({
    mutationFn: (outcome: 'CLEARED' | 'CONFIRMED') =>
      unwrap(adminLandFraudService.decide(s.id, outcome, note.trim())),
    onSuccess: (a, outcome) => {
      setNote('');
      onDone(a, outcome === 'CLEARED' ? 'Signal cleared.' : 'Signal confirmed.');
    },
    onError: (e) => onFailed(e, 'Could not record that.'),
  });
  const d = s.detail as Record<string, string | number | boolean | null>;
  return (
    <li className="rounded-xl border border-border p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-foreground">{LAND_FRAUD_SIGNAL_LABELS[s.code]}</p>
        <div className="flex gap-1.5">
          <Badge variant={severityTone(s.severity)}>{s.severity.toLowerCase()}</Badge>
          {s.status === 'CONFIRMED' && <Badge variant="danger">Confirmed</Badge>}
        </div>
      </div>
      <div className="mt-1 text-muted-foreground">
        {s.code === 'DOCUMENT_REUSED' && (
          <p>
            The same {String(d.documentType).toLowerCase().replace(/_/g, ' ')} file is on{' '}
            <Link
              href={`/admin/land/diligence/${encodeURIComponent(String(d.otherPropertyId))}`}
              className="text-primary hover:underline"
            >
              {String(d.otherPropertyTitle)}
            </Link>
            {d.sameOwner ? ' (also this seller’s)' : ' (another owner’s)'}
            {d.otherPropertyArchived ? ', now archived' : ''}.
          </p>
        )}
        {s.code === 'SHARED_PAYOUT_ACCOUNT' && (
          <p>
            {String(d.bankName ?? 'Bank')} ••{String(d.accountLast4)} also pays{' '}
            {String(d.otherSellerName)}.
          </p>
        )}
        {s.code === 'PAYOUT_ACCOUNT_CHANGED' && (
          <p>
            Changed to {String(d.bankName ?? 'a bank')} ••{String(d.accountLast4)} on{' '}
            {formatDate(String(d.changedAt))} with {String(d.pendingLandPayouts)} land payout(s)
            waiting.
          </p>
        )}
        {s.code === 'REPRESENTATIVE_LINKED' && <p>{representativeLinkText(s.detail)}</p>}
        {s.code === 'CONFLICTING_CLAIM' && (
          <p>
            {d.kind === 'BOUNDARY_OVERLAP'
              ? `Boundary overlaps ${Math.round(Number(d.overlapRatio ?? 0) * 100)}% with`
              : `Same ${d.kind === 'TITLE_NUMBER' ? 'title' : 'survey'} number as`}{' '}
            “{String(d.otherPropertyTitle ?? 'another listing')}”.
          </p>
        )}
        <p className="mt-1 text-xs">
          First seen {formatDate(s.firstSeenAt)} · last seen {formatDate(s.lastSeenAt)}
          {s.fraudAlertId && ' · in Fraud & Risk'}
        </p>
        {s.resolutionNote && <p className="mt-1 text-foreground">“{s.resolutionNote}”</p>}
      </div>
      {s.status === 'OPEN' && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
            showCount
            placeholder="What you checked and found"
            aria-label="What you checked and found"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={note.trim().length < 5 || decide.isPending}
              isLoading={decide.isPending && decide.variables === 'CLEARED'}
              onClick={() => decide.mutate('CLEARED')}
            >
              Clear: innocent
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={note.trim().length < 5 || decide.isPending}
              isLoading={decide.isPending && decide.variables === 'CONFIRMED'}
              onClick={() => decide.mutate('CONFIRMED')}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function ParcelSkeleton() {
  return (
    <div role="status" aria-label="Loading parcel" className="space-y-5">
      <Skeleton className="h-4 w-36" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <CardSkeleton lines={6} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
