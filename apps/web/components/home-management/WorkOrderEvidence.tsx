'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  Disclosure,
  DocumentPreviewButton,
  DocumentUpload,
  Field,
  ListSkeleton,
  QueryState,
  Select,
  Textarea,
  Timeline,
  useToast,
  type PendingUpload,
  type TimelineItem,
} from '@sureground/ui';
import { ClipboardCheck } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDualTime, formatLagosDate } from '@/lib/format';
import { SPEND_BAND_LABELS, SPEND_BAND_VARIANT, evidenceStates } from '@sureground/shared';
import { homeManagementKeys } from '@/lib/queryKeys';
import { StarRating } from '@/components/landlord/vendors/StarRating';
import {
  homeManagementService,
  type HomeManagementWorkOrder,
} from '@/services/homeManagementService';
import {
  PHOTO_STAGES,
  type EvidenceActorRole,
  type EvidenceApproval,
  type EvidenceDocument,
  type EvidenceInvoice,
  type EvidenceQuote,
  type EvidenceStage,
  type MaintenancePhoto,
  type WorkOrderPhotoStage,
} from '@/types/managed';

const PHOTO_STAGE_LABELS: Record<WorkOrderPhotoStage, string> = {
  REPORTED: 'The problem as reported',
  PROGRESS: 'Work in progress',
  COMPLETION: 'Finished work',
};

const STATE_LABELS = {
  done: 'Done',
  current: 'Waiting',
  pending: 'Not yet',
  blocked: 'Needs checking',
  skipped: 'Not needed',
} as const;

const viewerTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
};

const ROLE_LABELS: Record<EvidenceActorRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  FIELD_AGENT: 'Field agent',
  TENANT: 'Tenant',
};

const humanise = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

interface WorkOrderEvidenceProps {
  workOrder: HomeManagementWorkOrder;
  /** Only the owner rates the job. */
  viewerRole?: 'owner' | 'landlord' | 'manager';
}

/**
 * The job's record from problem to payment (DIA-22). Loads when opened, so a long queue doesn't
 * fetch every job's evidence up front.
 */
export function WorkOrderEvidence({ workOrder, viewerRole }: WorkOrderEvidenceProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="mt-4">
      <Disclosure
        summary={
          <span className="inline-flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Job record
          </span>
        }
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        {open && <EvidenceBody workOrder={workOrder} viewerRole={viewerRole} />}
      </Disclosure>
    </Card>
  );
}

function EvidenceBody({ workOrder, viewerRole }: WorkOrderEvidenceProps) {
  const query = useQuery({
    queryKey: homeManagementKeys.workOrderEvidence(workOrder.id),
    queryFn: () => unwrap(homeManagementService.getWorkOrderEvidence(workOrder.id)),
  });
  const zone = useMemo(() => viewerTimeZone(), []);
  const stages = useMemo(() => query.data?.stages ?? [], [query.data]);
  const flags = query.data?.flags ?? [];
  const feedbackStage = stages.find((s) => s.key === 'FEEDBACK');
  const canRate =
    viewerRole === 'owner' && workOrder.status === 'RESOLVED' && feedbackStage?.status !== 'DONE';
  const canAddPhotos = workOrder.status !== 'CANCELLED';

  const items: TimelineItem[] = useMemo(() => {
    const states = evidenceStates(stages.map((s) => s.status));
    return stages.map((stage, index) => ({
      id: stage.key,
      title: stage.label,
      state: states[index],
      date: stage.at ? (
        <time dateTime={stage.at}>
          {formatLagosDate(stage.at)} · {formatDualTime(stage.at, zone)}
        </time>
      ) : undefined,
      badge: stage.status === 'FLAGGED' ? <Badge variant="warning">Check this</Badge> : undefined,
      description: <StageDetail stage={stage} />,
      actions: documentTargets(stage) ? (
        <AttachDocumentForm
          workOrderId={workOrder.id}
          stageKey={stage.key as 'QUOTE' | 'INVOICE'}
          targets={documentTargets(stage)!}
        />
      ) : undefined,
    }));
  }, [stages, zone, workOrder.id]);

  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      isRetrying={query.isFetching}
      errorTitle="The job record could not be loaded"
      loading={<ListSkeleton rows={3} />}
    >
      <div className="space-y-4 pt-1">
        {flags.length > 0 && (
          <Alert variant="warning" title="Check before you approve or pay">
            <ul className="list-disc space-y-1 pl-4">
              {flags.map((flag) => (
                <li key={flag.code}>{flag.message}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Timeline
          items={items}
          stateLabels={STATE_LABELS}
          aria-label={`Record for ${workOrder.issueTitle}`}
        />

        {canAddPhotos && <PhotoUploadForm workOrderId={workOrder.id} />}
        {canRate && <FeedbackForm workOrderId={workOrder.id} />}
      </div>
    </QueryState>
  );
}

/** Quotes and invoices on the job that a document can be attached to. */
function documentTargets(stage: EvidenceStage): { id: string; label: string }[] | null {
  if (stage.key === 'QUOTE') {
    const quotes = (stage.items ?? []) as EvidenceQuote[];
    return quotes.length
      ? quotes.map((q) => ({
          id: q.id,
          label: `${q.vendor ?? 'Vendor'} · ${formatCurrency(q.amount)}`,
        }))
      : null;
  }
  if (stage.key === 'INVOICE') {
    const invoices = (stage.items ?? []) as EvidenceInvoice[];
    return invoices.length
      ? invoices.map((i) => ({
          id: i.id,
          label: `${i.vendor} · ${i.invoiceNumber ?? formatCurrency(i.amount)}`,
        }))
      : null;
  }
  return null;
}

function Documents({ documents }: { documents: EvidenceDocument[] }) {
  if (documents.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {documents.map((doc) => (
        <DocumentPreviewButton
          key={doc.id}
          file={{ url: doc.url, name: doc.name, mimeType: doc.mimeType }}
          label={doc.name}
        />
      ))}
    </span>
  );
}

function StageItems({ stage }: { stage: EvidenceStage }) {
  const items = stage.items ?? [];
  if (items.length === 0) return null;

  switch (stage.key) {
    case 'PHOTOS':
      return (
        <span className="flex flex-wrap gap-1">
          {(items as MaintenancePhoto[]).map((photo, index) => (
            <DocumentPreviewButton
              key={photo.id}
              file={{ url: photo.url, name: `Photo ${index + 1}` }}
              label={
                photo.legacy
                  ? `Photo ${index + 1}`
                  : `${PHOTO_STAGE_LABELS[photo.stage] ?? 'Photo'} · ${formatLagosDate(photo.takenAt)}`
              }
            />
          ))}
        </span>
      );
    case 'QUOTE':
      return (
        <ul className="space-y-1">
          {(items as EvidenceQuote[]).map((quote) => (
            <li key={quote.id} className="space-y-1">
              <span className="block text-foreground">
                {quote.vendor ?? 'Vendor'} · {formatCurrency(quote.amount)} ·{' '}
                {humanise(quote.status)}
              </span>
              <Documents documents={quote.documents} />
            </li>
          ))}
        </ul>
      );
    case 'APPROVAL':
      return (
        <ul className="space-y-1">
          {(items as EvidenceApproval[]).map((approval) => (
            <li key={approval.id} className="flex flex-wrap items-center gap-1.5">
              <span className="text-foreground">{formatCurrency(approval.amount)}</span>
              <Badge variant={SPEND_BAND_VARIANT[approval.band]}>
                {SPEND_BAND_LABELS[approval.band]}
              </Badge>
              <span>
                {humanise(approval.status)}
                {approval.decidedBy ? ` by ${approval.decidedBy.name}` : ''}
              </span>
            </li>
          ))}
        </ul>
      );
    case 'INVOICE':
      return (
        <ul className="space-y-2">
          {(items as EvidenceInvoice[]).map((invoice) => (
            <li key={invoice.id} className="space-y-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-foreground">
                  {invoice.vendor}
                  {invoice.invoiceNumber ? ` · ${invoice.invoiceNumber}` : ''} ·{' '}
                  {formatCurrency(invoice.amount)} · {humanise(invoice.status)}
                </span>
                {invoice.duplicateFlags.length > 0 && (
                  <Badge variant="warning">Possible duplicate</Badge>
                )}
              </span>
              {invoice.duplicateFlags.map((flag) => (
                <span key={flag.code} className="block">
                  {flag.message}
                </span>
              ))}
              <Documents documents={invoice.documents} />
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

function StageDetail({ stage }: { stage: EvidenceStage }) {
  if (!stage.detail && !stage.by && !stage.items?.length) return null;
  return (
    <span className="block space-y-1">
      {stage.detail && <span className="block">{stage.detail}</span>}
      {stage.by && (
        <span className="block">
          {stage.by.name} · {ROLE_LABELS[stage.by.role] ?? humanise(stage.by.role)}
        </span>
      )}
      <StageItems stage={stage} />
    </span>
  );
}

/** Owner or manager adds the paper behind a quote or an invoice. */
function AttachDocumentForm({
  workOrderId,
  stageKey,
  targets,
}: {
  workOrderId: string;
  stageKey: 'QUOTE' | 'INVOICE';
  targets: { id: string; label: string }[];
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState(targets[0].id);
  const [files, setFiles] = useState<PendingUpload[]>([]);
  const noun = stageKey === 'QUOTE' ? 'quote' : 'invoice';

  const attach = useMutation({
    mutationFn: () =>
      unwrap(
        homeManagementService.uploadWorkOrderDocument(
          workOrderId,
          stageKey === 'QUOTE' ? { quoteId: targetId } : { invoiceId: targetId },
          { file: files[0].file }
        )
      ),
    onSuccess: async () => {
      setFiles([]);
      await queryClient.invalidateQueries({
        queryKey: homeManagementKeys.workOrderEvidence(workOrderId),
      });
      toast.success(`Document added to the ${noun}.`);
    },
    onError: (error: Error) => toast.error(error.message || 'Could not add the document.'),
  });

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (files.length > 0) attach.mutate();
      }}
    >
      {targets.length > 1 && (
        <Select
          ariaLabel={`Which ${noun}`}
          value={targetId}
          onValueChange={setTargetId}
          options={targets.map((t) => ({ value: t.id, label: t.label }))}
          controlSize="sm"
        />
      )}
      <DocumentUpload
        value={files}
        onChange={setFiles}
        accept="application/pdf,image/jpeg,image/png,image/webp"
        maxSizeMB={10}
        label={`Add the ${noun} document`}
        disabled={attach.isPending}
      />
      {files.length > 0 && (
        <Button type="submit" size="sm" variant="secondary" isLoading={attach.isPending}>
          Attach
        </Button>
      )}
    </form>
  );
}

function PhotoUploadForm({ workOrderId }: { workOrderId: string }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<WorkOrderPhotoStage>('PROGRESS');
  const [files, setFiles] = useState<PendingUpload[]>([]);

  const upload = useMutation({
    mutationFn: async () => {
      for (const pending of files) {
        await unwrap(
          homeManagementService.uploadWorkOrderPhoto(workOrderId, { file: pending.file, stage })
        );
      }
    },
    onSuccess: async () => {
      setFiles([]);
      await queryClient.invalidateQueries({
        queryKey: homeManagementKeys.workOrderEvidence(workOrderId),
      });
      toast.success('Photos added to the job record.');
    },
    onError: (error: Error) => toast.error(error.message || 'Could not add the photos.'),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (files.length > 0) upload.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">Add photos</p>
      <Field label="What the photos show" htmlFor={`photo-stage-${workOrderId}`}>
        <Select
          id={`photo-stage-${workOrderId}`}
          value={stage}
          onValueChange={(value) => setStage(value as WorkOrderPhotoStage)}
          options={PHOTO_STAGES.map((value) => ({ value, label: PHOTO_STAGE_LABELS[value] }))}
        />
      </Field>
      <DocumentUpload
        value={files}
        onChange={setFiles}
        accept="image/jpeg,image/png,image/webp"
        multiple
        capture="environment"
        checkPhotoQuality
        maxSizeMB={10}
        label="Photos"
        hint="Each photo is stamped with the time it is added."
        disabled={upload.isPending}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={files.length === 0}
          isLoading={upload.isPending}
        >
          Add to record
        </Button>
      </div>
    </form>
  );
}

function FeedbackForm({ workOrderId }: { workOrderId: string }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const send = useMutation({
    mutationFn: () =>
      unwrap(
        homeManagementService.submitWorkOrderFeedback(workOrderId, {
          rating,
          comment: comment.trim() || undefined,
        })
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: homeManagementKeys.workOrderEvidence(workOrderId),
      });
      toast.success('Thank you. Your feedback is on the job record.');
    },
    onError: (error: Error) => toast.error(error.message || 'Could not send your feedback.'),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (rating >= 1) send.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">How did the job go?</p>
      <StarRating
        value={rating}
        onRate={setRating}
        disabled={send.isPending}
        size="md"
        label="Your rating"
      />
      <Field label="Comment" htmlFor={`feedback-${workOrderId}`} optionalLabel="Optional">
        <Textarea
          id={`feedback-${workOrderId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Anything we should know about the work or the contractor"
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={rating < 1} isLoading={send.isPending}>
          Send feedback
        </Button>
      </div>
    </form>
  );
}
