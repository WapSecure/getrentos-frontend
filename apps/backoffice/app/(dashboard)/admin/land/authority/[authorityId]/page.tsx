'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CircleAlert,
  Clock,
  FileSignature,
  Gavel,
  RefreshCw,
  Scale,
  ShieldAlert,
  Users,
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
} from '@getrentos/ui';
import {
  formatDate,
  LAND_AUTHORITY_INSTRUMENT_LABELS,
  LAND_AUTHORITY_STATUS_LABELS,
  LAND_CONSENT_LABELS,
  LAND_SIGNATORY_ROLE_LABELS,
  landAuthorityTone,
  unwrap,
  type LandAuthoritySignatory,
  type LandAuthorityView,
} from '@getrentos/shared';
import { useAdminUser } from '../../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { landQueryKeys, readLandApiError } from '@/lib/landDiligence';
import { adminLandAuthorityService } from '@/services/adminLandAuthorityService';
import { adminLandService } from '@/services/adminLandService';
import type { LandDiligenceDocument } from '@/types/land';
import { Fact, LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';

const CLOSED = new Set(['REJECTED', 'REVOKED']);

/** One seller's claim of authority to sell: evidence, consents, objections and the decision. */
export default function AdminLandAuthorityPage() {
  const params = useParams<{ authorityId: string }>();
  const authorityId = decodeURIComponent(params.authorityId);
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);

  const key = landQueryKeys.authority(authorityId);
  const detail = useQuery({
    queryKey: key,
    queryFn: () => unwrap(adminLandAuthorityService.detail(authorityId)),
    enabled: canView,
  });
  const propertyId = detail.data?.authority.propertyId;
  // The property's documents with signed links, to open the instrument and consents.
  const documents = useQuery({
    queryKey: landQueryKeys.case(propertyId ?? ''),
    queryFn: () => unwrap(adminLandService.getDiligenceDetail(propertyId as string)),
    enabled: canView && Boolean(propertyId),
    staleTime: 5 * 60_000,
  });
  const docs = new Map<string, LandDiligenceDocument>(
    (documents.data?.documents ?? []).map((d) => [d.id, d])
  );

  const done = (updated: LandAuthorityView, message: string) => {
    queryClient.setQueryData(key, updated);
    void queryClient.invalidateQueries({ queryKey: landQueryKeys.authorityRoot });
    void queryClient.invalidateQueries({ queryKey: landQueryKeys.diligenceRoot });
    setBlockers([]);
    setToast({ message, variant: 'success' });
  };
  const failed = (error: unknown, fallback: string) => {
    const info = readLandApiError(error, fallback);
    setBlockers(info.blockers);
    setToast({ message: info.message, variant: 'error' });
  };

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to seller authority"
        description="Reviewing it needs the verifications review permission."
      />
    );
  }
  if (detail.isLoading) return <PageLoadingState />;
  const view = detail.data;
  if (detail.isError || !view) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="This claim could not be loaded"
        description={detail.error instanceof Error ? detail.error.message : 'Claim not found.'}
      />
    );
  }
  const { authority, gaps, requirements } = view;
  const doc = (id: string | null) => (id ? docs.get(id) : undefined);

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <Link
        href="/admin/land/authority"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Seller authority
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="type-title">{authority.property.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {authority.capacityLabel} · {authority.claimant.legalName} ·{' '}
            <Link
              href={`/admin/land/diligence/${encodeURIComponent(authority.propertyId)}`}
              className="text-primary hover:underline"
            >
              Diligence case
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={landAuthorityTone(authority.status)}>
            {LAND_AUTHORITY_STATUS_LABELS[authority.status]}
          </Badge>
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
          <LandCaseSection title="The claim" icon={FileSignature}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Fact label="Capacity" value={authority.capacityLabel} />
              <Fact label="On behalf of" value={authority.principalName ?? '—'} />
              <Fact
                label="Instrument"
                value={
                  authority.instrumentType ? (
                    <DocLink
                      label={LAND_AUTHORITY_INSTRUMENT_LABELS[authority.instrumentType]}
                      document={doc(authority.instrumentDocumentId)}
                      missing={!authority.instrumentDocumentId}
                    />
                  ) : (
                    'None needed'
                  )
                }
              />
              <Fact
                label="Valid until"
                value={authority.expiresAt ? formatDate(authority.expiresAt) : 'No end date'}
              />
              <Fact
                label="Sent for review"
                value={authority.submittedAt ? formatDate(authority.submittedAt) : 'Not yet'}
              />
              <Fact label="Rules" value={authority.matrixVersion} />
            </div>
            {authority.appeal && (
              <div className="mt-4 rounded-xl bg-secondary/50 p-3 text-sm">
                <p className="font-medium text-foreground">
                  Appealed {formatDate(authority.appeal.at)}
                </p>
                <p className="whitespace-pre-wrap text-muted-foreground">{authority.appeal.note}</p>
              </div>
            )}
          </LandCaseSection>

          <LandCaseSection
            title="Who must consent"
            icon={Users}
            description="Consent from the person's own account counts at once. Paper consent counts once you have checked the evidence."
          >
            {authority.signatories.length === 0 ? (
              <PanelMessage>Nobody is listed.</PanelMessage>
            ) : (
              <ul className="space-y-3">
                {authority.signatories.map((signatory) => (
                  <SignatoryItem
                    key={signatory.id}
                    authorityId={authorityId}
                    signatory={signatory}
                    evidence={doc(signatory.evidenceDocumentId)}
                    witnessRequired={requirements.witnessRequired}
                    canDecide={canDecide}
                    closed={CLOSED.has(authority.status)}
                    onDone={done}
                    onFailed={failed}
                  />
                ))}
              </ul>
            )}
            {!CLOSED.has(authority.status) && (
              <RecordObjection authorityId={authorityId} onDone={done} onFailed={failed} />
            )}
          </LandCaseSection>

          <LegalInquiry
            view={view}
            authorityId={authorityId}
            documents={documents.data?.documents ?? []}
            onDone={done}
            onFailed={failed}
          />
        </div>

        <div className="space-y-5">
          <LandCaseSection title="Outstanding" icon={Clock}>
            {gaps.length === 0 ? (
              <PanelMessage>Everything this capacity requires is in.</PanelMessage>
            ) : (
              <ul className="space-y-1.5 text-sm text-foreground">
                {gaps.map((gap) => (
                  <li key={gap}>• {gap}</li>
                ))}
              </ul>
            )}
          </LandCaseSection>

          <Decision
            view={view}
            authorityId={authorityId}
            canDecide={canDecide}
            blockers={blockers}
            onDone={done}
            onFailed={failed}
          />
        </div>
      </div>
    </>
  );
}

const DocLink = ({
  label,
  document,
  missing,
}: {
  label: string;
  document?: LandDiligenceDocument;
  missing?: boolean;
}) =>
  document ? (
    <a
      href={document.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {label}
    </a>
  ) : (
    <span>
      {label}
      {missing ? ' (not attached)' : ''}
    </span>
  );

interface ActionProps {
  authorityId: string;
  onDone: (view: LandAuthorityView, message: string) => void;
  onFailed: (error: unknown, fallback: string) => void;
}

const SignatoryItem = ({
  authorityId,
  signatory,
  evidence,
  witnessRequired,
  canDecide,
  closed,
  onDone,
  onFailed,
}: ActionProps & {
  signatory: LandAuthoritySignatory;
  evidence?: LandDiligenceDocument;
  witnessRequired: boolean;
  canDecide: boolean;
  closed: boolean;
}) => {
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'none' | 'waive' | 'resolve'>('none');
  const [outcome, setOutcome] = useState<'UPHELD' | 'DISMISSED' | ''>('');

  const verify = useMutation({
    mutationFn: () => unwrap(adminLandAuthorityService.verifySignatory(authorityId, signatory.id)),
    onSuccess: (v) => onDone(v, 'Consent checked; it now counts.'),
    onError: (e) => onFailed(e, 'Could not check that consent.'),
  });
  const waive = useMutation({
    mutationFn: () =>
      unwrap(adminLandAuthorityService.waiveSignatory(authorityId, signatory.id, note.trim())),
    onSuccess: (v) => {
      setMode('none');
      setNote('');
      onDone(v, 'Consent set aside.');
    },
    onError: (e) => onFailed(e, 'Could not set that consent aside.'),
  });
  const resolve = useMutation({
    mutationFn: () =>
      unwrap(
        adminLandAuthorityService.resolveObjection(
          authorityId,
          signatory.id,
          outcome as 'UPHELD' | 'DISMISSED',
          note.trim()
        )
      ),
    onSuccess: (v) => {
      setMode('none');
      setNote('');
      onDone(
        v,
        outcome === 'UPHELD'
          ? 'Objection upheld; the claim is rejected. The seller was told.'
          : 'Objection dismissed.'
      );
    },
    onError: (e) => onFailed(e, 'Could not resolve the objection.'),
  });

  const objected = signatory.consent === 'OBJECTED';
  const needsCheck =
    signatory.consent === 'CONSENTED' &&
    !signatory.answeredFromAccount &&
    !signatory.checkedByStaff;
  return (
    <li
      className={`rounded-xl border p-3 text-sm ${objected ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{signatory.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {LAND_SIGNATORY_ROLE_LABELS[signatory.role]}
            {signatory.answeredFromAccount && ' · answered from their account'}
            {signatory.respondedAt && ` · ${formatDate(signatory.respondedAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {signatory.counts && <Badge variant="success">Counts</Badge>}
          {needsCheck && <Badge variant="warning">Needs checking</Badge>}
          <Badge variant={objected ? 'danger' : 'neutral'}>
            {LAND_CONSENT_LABELS[signatory.consent]}
          </Badge>
        </div>
      </div>
      {signatory.evidenceDocumentId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Evidence: <DocLink label={evidence?.name ?? 'Signed consent'} document={evidence} />
          {signatory.witnessName
            ? ` · witness ${signatory.witnessName}`
            : witnessRequired && !signatory.answeredFromAccount
              ? ' · no witness named'
              : ''}
        </p>
      )}
      {signatory.objectionReason && (
        <p className="mt-2 whitespace-pre-wrap text-foreground">“{signatory.objectionReason}”</p>
      )}
      {signatory.waivedReason && (
        <p className="mt-2 text-xs text-muted-foreground">{signatory.waivedReason}</p>
      )}

      {!closed && mode === 'none' && (
        <div className="mt-2 flex flex-wrap gap-2">
          {needsCheck && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => verify.mutate()}
              isLoading={verify.isPending}
            >
              Evidence checked
            </Button>
          )}
          {canDecide && objected && (
            <Button size="sm" variant="outline" onClick={() => setMode('resolve')}>
              Resolve objection
            </Button>
          )}
          {canDecide && !objected && signatory.consent !== 'WAIVED' && (
            <Button size="sm" variant="ghost" onClick={() => setMode('waive')}>
              Set aside
            </Button>
          )}
        </div>
      )}
      {mode !== 'none' && (
        <div className="mt-3 space-y-2">
          {mode === 'resolve' && (
            <Select
              value={outcome}
              onValueChange={(value) => setOutcome(value as 'UPHELD' | 'DISMISSED')}
              ariaLabel="Outcome"
              placeholder="Outcome"
              options={[
                { value: 'UPHELD', label: 'Uphold: the claim is rejected' },
                { value: 'DISMISSED', label: 'Dismiss: the objection is set aside' },
              ]}
            />
          )}
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder={
              mode === 'waive'
                ? 'Why this consent is not needed (e.g. deceased, represented by another)'
                : 'Reasons (the seller sees them)'
            }
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === 'resolve' && outcome === 'UPHELD' ? 'danger' : 'primary'}
              disabled={
                note.trim().length < 5 ||
                (mode === 'resolve' && !outcome) ||
                waive.isPending ||
                resolve.isPending
              }
              isLoading={waive.isPending || resolve.isPending}
              onClick={() => (mode === 'waive' ? waive.mutate() : resolve.mutate())}
            >
              {mode === 'waive' ? 'Set aside' : 'Record'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode('none')}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

const RecordObjection = ({ authorityId, onDone, onFailed }: ActionProps) => {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const record = useMutation({
    mutationFn: () =>
      unwrap(
        adminLandAuthorityService.recordObjection(authorityId, {
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          reason: reason.trim(),
        })
      ),
    onSuccess: (v) => {
      setOpen(false);
      setFullName('');
      setPhone('');
      setReason('');
      onDone(v, 'Objection recorded; the claim is disputed and the seller was told.');
    },
    onError: (e) => onFailed(e, 'Could not record the objection.'),
  });
  if (!open) {
    return (
      <Button
        className="mt-4"
        size="sm"
        variant="outline"
        icon={<ShieldAlert className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        Record an objection
      </Button>
    );
  }
  return (
    <div className="mt-4 space-y-2 rounded-xl bg-secondary/40 p-3">
      <p className="text-sm font-medium text-foreground">
        Someone not on the list objects (e.g. a competing heir)
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Their full name"
          maxLength={200}
        />
        <Input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone (optional)"
          maxLength={40}
        />
      </div>
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="What they say"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="danger"
          disabled={fullName.trim().length < 2 || reason.trim().length < 5 || record.isPending}
          isLoading={record.isPending}
          onClick={() => record.mutate()}
        >
          Record objection
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

const LegalInquiry = ({
  view,
  authorityId,
  documents,
  onDone,
  onFailed,
}: ActionProps & { view: LandAuthorityView; documents: LandDiligenceDocument[] }) => {
  const { authority, requirements } = view;
  const [note, setNote] = useState('');
  const [documentId, setDocumentId] = useState('');
  const save = useMutation({
    mutationFn: () =>
      unwrap(
        adminLandAuthorityService.recordLegalInquiry(
          authorityId,
          note.trim(),
          documentId || undefined
        )
      ),
    onSuccess: (v) => {
      setNote('');
      setDocumentId('');
      onDone(v, 'Legal inquiry recorded.');
    },
    onError: (e) => onFailed(e, 'Could not record the legal inquiry.'),
  });
  if (!requirements.legalInquiryRequired && !authority.legalInquiry) return null;
  const inquiryDoc = documents.find((d) => d.id === authority.legalInquiry?.documentId);
  return (
    <LandCaseSection
      title="Independent legal inquiry"
      icon={Scale}
      description="Required for family and community land: who the family or community is, who may speak for it, and whether anyone disputes the sale."
    >
      {authority.legalInquiry ? (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">
            Recorded {formatDate(authority.legalInquiry.at)}
            {inquiryDoc && (
              <>
                {' · '}
                <DocLink label={inquiryDoc.name} document={inquiryDoc} />
              </>
            )}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-foreground">{authority.legalInquiry.note}</p>
        </div>
      ) : (
        <PanelMessage>Not recorded yet.</PanelMessage>
      )}
      {!CLOSED.has(authority.status) && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={4000}
            placeholder={
              authority.legalInquiry
                ? 'Replace with an updated finding'
                : 'Who was spoken to, what was checked, what was found'
            }
          />
          {documents.length > 0 && (
            <Select
              value={documentId}
              onValueChange={setDocumentId}
              ariaLabel="Report document"
              placeholder="Attach a report from the property's documents (optional)"
              options={documents.map((d) => ({ value: d.id, label: d.name }))}
            />
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={note.trim().length < 5 || save.isPending}
            isLoading={save.isPending}
            onClick={() => save.mutate()}
          >
            Record inquiry
          </Button>
        </div>
      )}
    </LandCaseSection>
  );
};

const Decision = ({
  view,
  authorityId,
  canDecide,
  blockers,
  onDone,
  onFailed,
}: ActionProps & { view: LandAuthorityView; canDecide: boolean; blockers: string[] }) => {
  const { authority } = view;
  const [note, setNote] = useState('');
  const decide = useMutation({
    mutationFn: (decision: 'VERIFY' | 'REJECT') =>
      unwrap(adminLandAuthorityService.decide(authorityId, decision, note)),
    onSuccess: (v, decision) => {
      setNote('');
      onDone(
        v,
        decision === 'VERIFY' ? 'Authority verified.' : 'Claim rejected; the seller can appeal.'
      );
    },
    onError: (e) => onFailed(e, 'Could not record the decision.'),
  });
  const revoke = useMutation({
    mutationFn: () => unwrap(adminLandAuthorityService.revoke(authorityId, note.trim())),
    onSuccess: (v) => {
      setNote('');
      onDone(v, 'Claim revoked.');
    },
    onError: (e) => onFailed(e, 'Could not revoke the claim.'),
  });

  return (
    <LandCaseSection title="Decision" icon={Gavel}>
      {authority.decision && (
        <div className="mb-3 text-sm">
          <p className="font-medium text-foreground">
            {LAND_AUTHORITY_STATUS_LABELS[authority.status]} · {formatDate(authority.decision.at)}
          </p>
          {authority.decision.note && (
            <p className="whitespace-pre-wrap text-muted-foreground">{authority.decision.note}</p>
          )}
        </div>
      )}
      {blockers.length > 0 && (
        <ul className="mb-3 space-y-1 rounded-xl bg-destructive/10 p-3 text-sm text-foreground">
          {blockers.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
      )}
      {!canDecide ? (
        <PanelMessage>Deciding needs the verifications approve permission.</PanelMessage>
      ) : authority.status === 'DISPUTED' ? (
        <PanelMessage>Resolve every objection before deciding.</PanelMessage>
      ) : authority.status === 'PENDING_REVIEW' || !CLOSED.has(authority.status) ? (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Reasons (the seller sees them; required to reject or revoke)"
          />
          {authority.status === 'PENDING_REVIEW' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={view.gaps.length > 0 || decide.isPending}
                isLoading={decide.isPending && decide.variables === 'VERIFY'}
                onClick={() => decide.mutate('VERIFY')}
              >
                Verify authority
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={note.trim().length < 5 || decide.isPending}
                isLoading={decide.isPending && decide.variables === 'REJECT'}
                onClick={() => decide.mutate('REJECT')}
              >
                Reject
              </Button>
            </div>
          ) : (
            <PanelMessage>
              {authority.status === 'DRAFT'
                ? 'The seller has not sent this claim for review yet.'
                : 'Verified. Revoke it if it no longer holds.'}
            </PanelMessage>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={note.trim().length < 5 || revoke.isPending}
            isLoading={revoke.isPending}
            onClick={() => revoke.mutate()}
          >
            Revoke the claim
          </Button>
          <p className="text-xs text-muted-foreground">
            You cannot decide a claim on land you sell, own or hold authority on.
          </p>
        </div>
      ) : (
        <PanelMessage>This claim is closed.</PanelMessage>
      )}
    </LandCaseSection>
  );
};
