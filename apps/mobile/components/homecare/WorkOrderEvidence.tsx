import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  Images,
  TriangleAlert,
} from '@sureground/icons/native';
import {
  PHOTO_STAGES,
  SPEND_BAND_LABELS,
  SPEND_BAND_VARIANT,
  evidenceStates,
  formatDualTime,
  humaniseStatus,
  type EvidenceActorRole,
  type EvidenceApproval,
  type EvidenceDocument,
  type EvidenceInvoice,
  type EvidenceQuote,
  type EvidenceStage,
  type EvidenceTimelineState,
  type MaintenancePhoto,
  type WorkOrderPhotoStage,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  Divider,
  FormAlert,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { homeCareApi, type WorkOrder } from '@/lib/api/homeCare';
import { errorMessage } from '@/lib/api/client';
import { capturePhoto, pickPhotos } from '@/lib/filePicker';
import { formatDate, formatNaira } from '@/lib/format';
import type { PickedFile } from '@/lib/api/documents';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { StarRating } from '@/components/reviews/StarRating';

const PHOTO_STAGE_LABELS: Record<WorkOrderPhotoStage, string> = {
  REPORTED: 'The problem as reported',
  PROGRESS: 'Work in progress',
  COMPLETION: 'Finished work',
};

const STATE_LABELS: Record<EvidenceTimelineState, string> = {
  done: 'Done',
  current: 'Waiting',
  pending: 'Not yet',
  blocked: 'Needs checking',
  skipped: 'Not needed',
};

const ROLE_LABELS: Record<EvidenceActorRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  FIELD_AGENT: 'Field agent',
  TENANT: 'Tenant',
};

const viewerTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
};

/**
 * The job's record from problem to payment (DIA-22). Loads when opened, so the screen doesn't fetch
 * it until someone wants it.
 */
export function WorkOrderEvidence({ w, canRate }: { w: WorkOrder; canRate: boolean }) {
  const { colors, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <Card style={{ gap: spacing.md }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }}
      >
        <ClipboardCheck size={18} color={colors.mutedForeground} />
        <Text variant="heading" headingLevel={2} style={{ flex: 1 }}>
          Job record
        </Text>
        <Chevron size={18} color={colors.mutedForeground} />
      </Pressable>
      {open ? <EvidenceBody w={w} canRate={canRate} /> : null}
    </Card>
  );
}

function EvidenceBody({ w, canRate }: { w: WorkOrder; canRate: boolean }) {
  const { spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.homeCare.evidence(w.id),
    queryFn: () => homeCareApi.evidence(w.id),
  });
  const zone = useMemo(() => viewerTimeZone(), []);
  const stages = query.data?.stages ?? [];
  const states = evidenceStates(stages.map((s) => s.status));
  const flags = query.data?.flags ?? [];
  const feedbackDone = stages.find((s) => s.key === 'FEEDBACK')?.status === 'DONE';

  return (
    <QueryState query={query} skeleton={<ListSkeleton rows={3} />}>
      <View style={{ gap: spacing.md }}>
        {flags.length ? (
          <FormAlert
            tone="warning"
            title="Check before you approve or pay"
            message={flags.map((f) => f.message).join('\n')}
          />
        ) : null}
        {stages.map((stage, i) => (
          <StageRow key={stage.key} stage={stage} state={states[i]} zone={zone} />
        ))}
        {w.status !== 'CANCELLED' ? <PhotoForm workOrderId={w.id} /> : null}
        {canRate && w.status === 'RESOLVED' && !feedbackDone ? (
          <FeedbackForm workOrderId={w.id} />
        ) : null}
      </View>
    </QueryState>
  );
}

function StageRow({
  stage,
  state,
  zone,
}: {
  stage: EvidenceStage;
  state: EvidenceTimelineState;
  zone: string | null;
}) {
  const { colors, spacing } = useTheme();
  const icon = {
    done: { Icon: CheckCircle2, color: colors.success },
    current: { Icon: Clock3, color: colors.primary },
    pending: { Icon: Circle, color: colors.mutedForeground },
    blocked: { Icon: TriangleAlert, color: colors.warning },
    skipped: { Icon: CircleDashed, color: colors.mutedForeground },
  }[state];
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <icon.Icon size={18} color={icon.color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
            {stage.label}
          </Text>
          {stage.status === 'FLAGGED' ? (
            <Badge label="Check this" tone="warning" />
          ) : (
            <Text variant="caption" color="mutedForeground">
              {STATE_LABELS[state]}
            </Text>
          )}
        </View>
        {stage.at ? (
          <Text variant="caption" color="mutedForeground">
            {formatDate(stage.at, 'short')} · {formatDualTime(stage.at, zone)}
          </Text>
        ) : null}
        {stage.detail ? (
          <Text variant="caption" color="mutedForeground">
            {stage.detail}
          </Text>
        ) : null}
        {stage.by ? (
          <Text variant="caption" color="mutedForeground">
            {stage.by.name} · {ROLE_LABELS[stage.by.role] ?? humaniseStatus(stage.by.role)}
          </Text>
        ) : null}
        <StageItems stage={stage} />
      </View>
    </View>
  );
}

const openUrl = (url: string) => void WebBrowser.openBrowserAsync(url);

function Documents({ documents }: { documents: EvidenceDocument[] }) {
  const { spacing } = useTheme();
  if (!documents.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {documents.map((doc) => (
        <Button
          key={doc.id}
          label={doc.name}
          size="sm"
          variant="ghost"
          fullWidth={false}
          onPress={() => openUrl(doc.url)}
        />
      ))}
    </View>
  );
}

function StageItems({ stage }: { stage: EvidenceStage }) {
  const { spacing } = useTheme();
  const items = stage.items ?? [];
  if (!items.length) return null;
  switch (stage.key) {
    case 'PHOTOS':
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {(items as MaintenancePhoto[]).map((photo, i) => (
            <Button
              key={photo.id}
              size="sm"
              variant="secondary"
              fullWidth={false}
              label={
                photo.legacy
                  ? `Photo ${i + 1}`
                  : `${PHOTO_STAGE_LABELS[photo.stage] ?? 'Photo'} · ${formatDate(photo.takenAt, 'short')}`
              }
              onPress={() => openUrl(photo.url)}
            />
          ))}
        </View>
      );
    case 'QUOTE':
      return (
        <View style={{ gap: spacing.xs }}>
          {(items as EvidenceQuote[]).map((q) => (
            <View key={q.id} style={{ gap: spacing.xs }}>
              <Text variant="caption">
                {q.vendor ?? 'Vendor'} · {formatNaira(q.amount)} · {humaniseStatus(q.status)}
              </Text>
              <Documents documents={q.documents} />
            </View>
          ))}
        </View>
      );
    case 'APPROVAL':
      return (
        <View style={{ gap: spacing.xs }}>
          {(items as EvidenceApproval[]).map((a) => (
            <View
              key={a.id}
              style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}
            >
              <Text variant="caption">{formatNaira(a.amount)}</Text>
              <Badge label={SPEND_BAND_LABELS[a.band]} tone={SPEND_BAND_VARIANT[a.band]} />
              <Text variant="caption" color="mutedForeground">
                {humaniseStatus(a.status)}
                {a.decidedBy ? ` by ${a.decidedBy.name}` : ''}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'INVOICE':
      return (
        <View style={{ gap: spacing.sm }}>
          {(items as EvidenceInvoice[]).map((inv) => (
            <View key={inv.id} style={{ gap: spacing.xs }}>
              <Text variant="caption">
                {inv.vendor}
                {inv.invoiceNumber ? ` · ${inv.invoiceNumber}` : ''} · {formatNaira(inv.amount)} ·{' '}
                {humaniseStatus(inv.status)}
              </Text>
              {inv.duplicateFlags.length ? (
                <Badge label="Possible duplicate" tone="warning" />
              ) : null}
              {inv.duplicateFlags.map((f) => (
                <Text key={f.code} variant="caption" color="mutedForeground">
                  {f.message}
                </Text>
              ))}
              <Documents documents={inv.documents} />
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

function PhotoForm({ workOrderId }: { workOrderId: string }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [stage, setStage] = useState<WorkOrderPhotoStage>('PROGRESS');
  const upload = useMutation({
    mutationFn: async (files: PickedFile[]) => {
      for (const file of files) await homeCareApi.addPhoto(workOrderId, file, stage);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.homeCare.evidence(workOrderId) });
      toast.show('Photos added to the job record.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not add the photos.'), 'error'),
  });
  const add = async (source: 'camera' | 'library') => {
    const files =
      source === 'camera' ? [await capturePhoto()].filter((f) => f !== null) : await pickPhotos();
    if (files.length) upload.mutate(files);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Divider />
      <Text variant="bodyStrong">Add photos</Text>
      <ChipSelect
        label="What the photos show"
        options={PHOTO_STAGES.map((value) => ({ value, label: PHOTO_STAGE_LABELS[value] }))}
        value={stage}
        onChange={setStage}
        disabled={upload.isPending}
      />
      <Text variant="caption" color="mutedForeground">
        Each photo is stamped with the time it is added.
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          label="Take photo"
          variant="outline"
          size="sm"
          fullWidth={false}
          icon={<Camera size={16} color={colors.foreground} />}
          loading={upload.isPending}
          disabled={upload.isPending}
          onPress={() => void add('camera')}
        />
        <Button
          label="Choose photos"
          variant="outline"
          size="sm"
          fullWidth={false}
          icon={<Images size={16} color={colors.foreground} />}
          disabled={upload.isPending}
          onPress={() => void add('library')}
        />
      </View>
    </View>
  );
}

function FeedbackForm({ workOrderId }: { workOrderId: string }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const send = useMutation({
    mutationFn: () =>
      homeCareApi.feedback(workOrderId, { rating, comment: comment.trim() || undefined }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.homeCare.evidence(workOrderId) });
      toast.show('Thank you. Your feedback is on the job record.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send your feedback.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <Divider />
      <Text variant="bodyStrong">How did the job go?</Text>
      <StarRating value={rating} onChange={setRating} disabled={send.isPending} />
      <TextField
        label="Comment (optional)"
        value={comment}
        onChangeText={setComment}
        maxLength={2000}
        multiline
        placeholder="Anything we should know about the work or the contractor"
      />
      <Button
        label="Send feedback"
        size="sm"
        loading={send.isPending}
        disabled={rating < 1 || send.isPending}
        onPress={() => send.mutate()}
      />
    </View>
  );
}
