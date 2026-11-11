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
import { formatDualTime, formatLagosDate } from '@/lib/format';
import { evidenceStates } from '@/lib/managedSpend';
import { homeManagementKeys } from '@/lib/queryKeys';
import { StarRating } from '@/components/landlord/vendors/StarRating';
import {
  homeManagementService,
  type HomeManagementWorkOrder,
} from '@/services/homeManagementService';
import { PHOTO_STAGES, type EvidenceStage, type WorkOrderPhotoStage } from '@/types/managed';

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

const humanRole = (role: string) =>
  role
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
    }));
  }, [stages, zone]);

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

function StageDetail({ stage }: { stage: EvidenceStage }) {
  const photos = stage.items ?? [];
  if (!stage.detail && !stage.by && photos.length === 0) return null;
  return (
    <span className="block space-y-1">
      {stage.detail && <span className="block">{stage.detail}</span>}
      {stage.by && (
        <span className="block text-xs">
          {stage.by.name} · {humanRole(stage.by.role)}
        </span>
      )}
      {photos.length > 0 && (
        <span className="flex flex-wrap gap-1">
          {photos.map((photo, index) => (
            <DocumentPreviewButton
              key={photo.id ?? photo.url}
              file={{ url: photo.url, name: photo.label ?? `Photo ${index + 1}` }}
              label={
                photo.takenAt
                  ? `${photo.label ?? `Photo ${index + 1}`} · ${formatLagosDate(photo.takenAt)}`
                  : (photo.label ?? `Photo ${index + 1}`)
              }
            />
          ))}
        </span>
      )}
    </span>
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
          maxLength={1000}
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
