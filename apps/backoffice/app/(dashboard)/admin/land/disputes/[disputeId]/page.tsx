'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CircleAlert,
  FileText,
  Gavel,
  History,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Upload,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageLoadingState,
  Select,
  Textarea,
  Toast,
  type ToastVariant,
  DocumentUpload,
  type PendingUpload,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { humaniseEnum, landQueryKeys, readLandApiError } from '@/lib/landDiligence';
import { adminLandDisputeService } from '@/services/adminLandDisputeService';
import {
  LAND_DISPUTE_KIND_LABELS,
  type AdminLandDispute,
  type LandDisputeOutcome,
} from '@/types/landDispute';
import { Fact, LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';

const LIVE = new Set(['OPEN', 'UNDER_INVESTIGATION', 'APPEALED']);

/** One land dispute in full: hold, decision, evidence and the case timeline. */
export default function AdminLandDisputePage() {
  const params = useParams<{ disputeId: string }>();
  const disputeId = decodeURIComponent(params.disputeId);
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [holdText, setHoldText] = useState('');
  const [outcome, setOutcome] = useState<LandDisputeOutcome | ''>('');
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [noteShared, setNoteShared] = useState(false);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const file = uploads[0]?.file ?? null;
  const [fileNote, setFileNote] = useState('');

  const key = landQueryKeys.dispute(disputeId);
  const detail = useQuery({
    queryKey: key,
    queryFn: () => unwrap(adminLandDisputeService.detail(disputeId)),
    enabled: canView,
  });

  const done = (updated: AdminLandDispute, message: string) => {
    queryClient.setQueryData(key, updated);
    void queryClient.invalidateQueries({ queryKey: landQueryKeys.disputesRoot });
    setToast({ message, variant: 'success' });
  };
  const failed = (error: unknown, fallback: string) =>
    setToast({ message: readLandApiError(error, fallback).message, variant: 'error' });

  const assign = useMutation({
    mutationFn: () => unwrap(adminLandDisputeService.assignToMe(disputeId)),
    onSuccess: (d) => done(d, 'Assigned to you; the case is under investigation.'),
    onError: (e) => failed(e, 'Could not assign the case.'),
  });
  const hold = useMutation({
    mutationFn: () => unwrap(adminLandDisputeService.hold(disputeId, holdText.trim())),
    onSuccess: (d) => {
      setHoldText('');
      done(d, 'Land on hold: off the market, payouts paused. The owner was told.');
    },
    onError: (e) => failed(e, 'Could not hold the land.'),
  });
  const lift = useMutation({
    mutationFn: () => unwrap(adminLandDisputeService.liftHold(disputeId, holdText.trim())),
    onSuccess: (d) => {
      setHoldText('');
      done(d, 'Hold lifted.');
    },
    onError: (e) => failed(e, 'Could not lift the hold.'),
  });
  const decide = useMutation({
    mutationFn: () =>
      unwrap(
        adminLandDisputeService.decide(disputeId, outcome as LandDisputeOutcome, decision.trim())
      ),
    onSuccess: (d) => {
      setOutcome('');
      setDecision('');
      done(d, 'Decision recorded; the parties were told.');
    },
    onError: (e) => failed(e, 'Could not record the decision.'),
  });
  const addNote = useMutation({
    mutationFn: () => unwrap(adminLandDisputeService.addNote(disputeId, note.trim(), noteShared)),
    onSuccess: (d) => {
      setNote('');
      setNoteShared(false);
      done(d, noteShared ? 'Note shared with the parties.' : 'Staff note added.');
    },
    onError: (e) => failed(e, 'Could not add the note.'),
  });
  const upload = useMutation({
    mutationFn: () =>
      unwrap(adminLandDisputeService.addEvidence(disputeId, file as File, fileNote)),
    onSuccess: (d) => {
      setUploads([]);
      setFileNote('');
      done(d, 'Evidence added to the case.');
    },
    onError: (e) => failed(e, 'Could not upload that evidence.'),
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to land disputes"
        description="Reviewing disputes needs the verifications review permission."
      />
    );
  }
  if (detail.isLoading) return <PageLoadingState />;
  const d = detail.data;
  if (detail.isError || !d) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="This case could not be loaded"
        description={detail.error instanceof Error ? detail.error.message : 'Case not found.'}
      />
    );
  }

  const live = LIVE.has(d.status);
  const deciding = d.status === 'APPEALED' ? 'appeal' : 'case';
  const canDecideNow =
    canDecide &&
    (d.status === 'OPEN' || d.status === 'UNDER_INVESTIGATION' || d.status === 'APPEALED');

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <Link
        href="/admin/land/disputes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Land disputes
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="type-title font-mono">{d.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {LAND_DISPUTE_KIND_LABELS[d.kind] ?? d.kind} ·{' '}
            <Link
              href={`/admin/land/diligence/${encodeURIComponent(d.propertyId)}`}
              className="text-primary hover:underline"
            >
              {d.propertyTitle}
            </Link>
            {d.purchaseReference && ` · purchase ${d.purchaseReference}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {d.holdActive && (
            <Badge variant="danger" icon={<PauseCircle className="h-3.5 w-3.5" />}>
              Land on hold
            </Badge>
          )}
          <Badge variant="info">{humaniseEnum(d.status)}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => detail.refetch()}
            isLoading={detail.isFetching}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Reload
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <LandCaseSection title="The complaint" icon={Gavel}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Fact label="Raised by" value={d.raisedByName} />
              <Fact label="Owner" value={d.ownerName} />
              <Fact label="Opened" value={formatDate(d.createdAt)} />
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{d.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              The owner and buyer do not see who raised this case.
            </p>
          </LandCaseSection>

          <LandCaseSection
            title="Evidence"
            icon={FileText}
            description="Kept permanently with its SHA-256; nothing here can be removed."
          >
            {d.evidence.length === 0 ? (
              <PanelMessage>No evidence yet.</PanelMessage>
            ) : (
              <ul className="space-y-2">
                {d.evidence.map((item) => (
                  <li key={item.id} className="rounded-xl border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {item.fileName}
                      </a>
                      <Badge variant={item.source === 'ADMIN' ? 'info' : 'neutral'}>
                        {item.source === 'ADMIN' ? 'Staff' : 'Party'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.uploadedByName} · {formatDate(item.createdAt)} ·{' '}
                      <span className="font-mono">{item.fileHash.slice(0, 16)}…</span>
                    </p>
                    {item.note && <p className="mt-1 text-foreground">“{item.note}”</p>}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-y-2">
              <DocumentUpload
                value={uploads}
                onChange={setUploads}
                multiple={false}
                maxSizeMB={20}
                label="Evidence file"
              />
              <Input
                value={fileNote}
                onChange={(event) => setFileNote(event.target.value)}
                placeholder="What this shows (optional)"
                maxLength={1000}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!file || upload.isPending}
                isLoading={upload.isPending}
                onClick={() => upload.mutate()}
                icon={<Upload className="h-4 w-4" />}
              >
                Add evidence
              </Button>
            </div>
          </LandCaseSection>

          <LandCaseSection title="Timeline" icon={History}>
            <ol className="space-y-2">
              {d.events.map((event) => (
                <li key={event.id} className="text-sm">
                  <span className="font-medium text-foreground">{humaniseEnum(event.action)}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {event.actorName ?? 'System'} · {formatDate(event.createdAt)}
                    {!event.visibleToParties && ' · staff only'}
                  </span>
                  {event.note && (
                    <p className="whitespace-pre-wrap text-muted-foreground">{event.note}</p>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-4 space-y-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                maxLength={5000}
                placeholder="Add a note to the case"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={noteShared}
                    onChange={(event) => setNoteShared(event.target.checked)}
                  />
                  Share with the parties
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={note.trim().length < 5 || addNote.isPending}
                  isLoading={addNote.isPending}
                  onClick={() => addNote.mutate()}
                >
                  Add note
                </Button>
              </div>
            </div>
          </LandCaseSection>
        </div>

        <div className="space-y-5">
          <LandCaseSection title="Handling">
            <div className="grid gap-3">
              <Fact label="Assigned to" value={d.assignedToName ?? 'Nobody yet'} />
              {live && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => assign.mutate()}
                  isLoading={assign.isPending}
                >
                  Assign to me
                </Button>
              )}
            </div>
          </LandCaseSection>

          <LandCaseSection title="Hold" icon={PauseCircle}>
            {d.holdActive ? (
              <p className="text-sm text-foreground">
                On hold since {d.heldAt ? formatDate(d.heldAt) : '—'}
                {d.heldByName ? ` by ${d.heldByName}` : ''}: {d.holdReason}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {d.holdSuggested && live
                  ? 'Consider holding the land: this kind of case can mean the seller cannot sell.'
                  : 'The land is not held for this case.'}
              </p>
            )}
            {canDecide && (d.holdActive || live) && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={holdText}
                  onChange={(event) => setHoldText(event.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder={
                    d.holdActive
                      ? 'Why the hold is lifted'
                      : 'Why the land is held (the owner sees this)'
                  }
                />
                {d.holdActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={holdText.trim().length < 5 || lift.isPending}
                    isLoading={lift.isPending}
                    onClick={() => lift.mutate()}
                    icon={<PlayCircle className="h-4 w-4" />}
                  >
                    Lift hold
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={holdText.trim().length < 10 || hold.isPending}
                    isLoading={hold.isPending}
                    onClick={() => hold.mutate()}
                    icon={<PauseCircle className="h-4 w-4" />}
                  >
                    Hold the land
                  </Button>
                )}
              </div>
            )}
          </LandCaseSection>

          <LandCaseSection title="Decision" icon={Gavel}>
            {d.outcome && (
              <div className="mb-3 text-sm">
                <p className="font-medium text-foreground">
                  {humaniseEnum(d.outcome)}
                  {d.decidedAt && ` · ${formatDate(d.decidedAt)}`}
                  {d.decidedByName && ` · ${d.decidedByName}`}
                </p>
                <p className="whitespace-pre-wrap text-muted-foreground">{d.decision}</p>
              </div>
            )}
            {d.appealReason && (
              <div className="mb-3 rounded-xl bg-secondary/50 p-3 text-sm">
                <p className="font-medium text-foreground">
                  Appealed {d.appealedAt && formatDate(d.appealedAt)}
                </p>
                <p className="whitespace-pre-wrap text-muted-foreground">{d.appealReason}</p>
                {d.appealOutcome && (
                  <p className="mt-2 text-foreground">
                    Appeal {humaniseEnum(d.appealOutcome).toLowerCase()}: {d.appealDecision}
                  </p>
                )}
              </div>
            )}
            {canDecideNow ? (
              <div className="space-y-2">
                <Select
                  value={outcome}
                  onValueChange={(value) => setOutcome(value as LandDisputeOutcome)}
                  ariaLabel={`Outcome of the ${deciding}`}
                  placeholder={`Outcome of the ${deciding}`}
                  options={[
                    { value: 'UPHELD', label: 'Upheld' },
                    { value: 'DISMISSED', label: 'Dismissed' },
                  ]}
                />
                <Textarea
                  value={decision}
                  onChange={(event) => setDecision(event.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="The decision and its reasons (the parties see this)"
                />
                <p className="text-xs text-muted-foreground">
                  {deciding === 'appeal'
                    ? 'An appeal must be decided by someone other than the original decision-maker.'
                    : 'Dismissing lifts this case’s hold. Upholding keeps the land on hold until you lift it.'}
                </p>
                <Button
                  size="sm"
                  disabled={!outcome || decision.trim().length < 20 || decide.isPending}
                  isLoading={decide.isPending}
                  onClick={() => decide.mutate()}
                >
                  Record decision
                </Button>
              </div>
            ) : (
              !d.outcome && (
                <PanelMessage>Deciding needs the verifications approve permission.</PanelMessage>
              )
            )}
          </LandCaseSection>
        </div>
      </div>
    </>
  );
}
