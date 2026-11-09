import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CheckCircle2, Plus, Send } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  FormAlert,
  NumberField,
  Price,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  CONDITION_LABEL,
  CONDITION_TONE,
  INSPECTION_CONDITIONS,
  INSPECTION_STATUS_LABEL,
  INSPECTION_STATUS_TONE,
  INSPECTION_TYPE_LABEL,
  managementApi,
  type InspectionCondition,
  type InspectionItem,
} from '@/lib/api/management';
import type { PickedFile } from '@/lib/api/documents';
import { errorMessage } from '@/lib/api/client';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

function choosePhoto(): Promise<PickedFile | null> {
  return new Promise((resolve) => {
    Alert.alert('Add a photo', undefined, [
      { text: 'Take photo', onPress: () => capturePhoto().then(resolve) },
      { text: 'Choose from library', onPress: () => pickPhoto().then(resolve) },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

export default function PropertyInspectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.management.inspection(id),
    queryFn: () => managementApi.inspection(id),
    enabled: !!id,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['management', 'inspections'] });

  const complete = useMutation({
    mutationFn: () => managementApi.completeInspection(id),
    onSuccess: () => {
      refresh();
      toast.show('Inspection completed.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not complete the inspection.'), 'error'),
  });
  const share = useMutation({
    mutationFn: () => managementApi.shareInspection(id),
    onSuccess: () => {
      refresh();
      toast.show('Shared with the owner.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not share the report.'), 'error'),
  });

  const i = query.data;
  const isDraft = i?.status === 'DRAFT';

  const confirmComplete = () =>
    Alert.alert(
      'Complete this inspection?',
      'A completed report is locked: no more areas or photos can be added.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => complete.mutate() },
      ]
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow={i ? `${INSPECTION_TYPE_LABEL[i.type]} inspection` : 'Inspection'}
        title={i?.propertyTitle ?? 'Inspection'}
        subtitle={
          i
            ? [
                i.conductedByName ? `By ${i.conductedByName}` : null,
                i.scheduledFor ? `Scheduled ${formatDate(i.scheduledFor, 'short')}` : null,
                i.conductedAt ? `Done ${formatDate(i.conductedAt, 'short')}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            : undefined
        }
        onBack={() => goBack()}
      />
      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="This inspection did not load"
      >
        {i ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => void query.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Badge
                label={INSPECTION_STATUS_LABEL[i.status]}
                tone={INSPECTION_STATUS_TONE[i.status]}
              />
              <View style={{ flex: 1 }} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="caption" color="mutedForeground">
                  Estimated remedial
                </Text>
                <Price amount={i.summary.estimatedRemedialCost} variant="bodyStrong" />
              </View>
            </View>

            {i.summaryNotes ? (
              <Card padding={spacing.lg}>
                <Text variant="callout" color="mutedForeground">
                  {i.summaryNotes}
                </Text>
              </Card>
            ) : null}

            {i.leaseId && !isDraft ? (
              <Text variant="caption" color="mutedForeground">
                {i.tenantAcknowledgedAt
                  ? `The tenant acknowledged this report on ${formatDate(i.tenantAcknowledgedAt, 'short')}${
                      i.tenantComment ? `: “${i.tenantComment}”` : '.'
                    }`
                  : 'Waiting for the tenant to acknowledge this report.'}
              </Text>
            ) : null}

            <Text variant="bodyStrong" accessibilityRole="header">
              Areas
            </Text>
            {i.items.length === 0 ? (
              <Text variant="callout" color="mutedForeground">
                No areas recorded yet.
              </Text>
            ) : (
              i.items.map((item) => (
                <AreaCard key={item.id} inspectionId={i.id} item={item} editable={isDraft} />
              ))
            )}

            {isDraft ? <AddAreaForm inspectionId={i.id} /> : null}

            {isDraft ? (
              <Button
                label="Complete inspection"
                icon={<CheckCircle2 size={16} color={colors.primaryForeground} />}
                loading={complete.isPending}
                disabled={i.items.length === 0 || complete.isPending}
                onPress={confirmComplete}
              />
            ) : null}
            {isDraft && i.items.length === 0 ? (
              <Text variant="caption" color="mutedForeground" center>
                Add at least one area before completing.
              </Text>
            ) : null}

            {i.status === 'COMPLETED' && i.canShareWithOwner ? (
              <Button
                label="Share with the owner"
                variant="secondary"
                icon={<Send size={16} color={colors.secondaryForeground} />}
                loading={share.isPending}
                disabled={share.isPending}
                onPress={() => share.mutate()}
              />
            ) : null}
            {i.sharedAt ? (
              <FormAlert
                tone="info"
                message={`Shared with the owner on ${formatDate(i.sharedAt)}.`}
              />
            ) : null}
          </ScrollView>
        ) : null}
      </QueryState>
    </View>
  );
}

function AreaCard({
  inspectionId,
  item,
  editable,
}: {
  inspectionId: string;
  item: InspectionItem;
  editable: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const upload = useMutation({
    mutationFn: (file: PickedFile) => managementApi.addInspectionPhoto(inspectionId, item.id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['management', 'inspections'] });
      toast.show('Photo added.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'That photo did not upload.'), 'error'),
  });

  const addPhoto = async () => {
    const file = await choosePhoto();
    if (file) upload.mutate(file);
  };

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {item.area}
        </Text>
        <Badge label={CONDITION_LABEL[item.condition]} tone={CONDITION_TONE[item.condition]} />
      </View>
      {item.notes ? (
        <Text variant="callout" color="mutedForeground">
          {item.notes}
        </Text>
      ) : null}
      {item.estimatedCost ? (
        <Text variant="caption">
          Estimated cost: <Price amount={item.estimatedCost} variant="caption" />
        </Text>
      ) : null}
      {item.photos.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {item.photos.map((p) => (
            <Image
              key={p.id}
              source={{ uri: p.url }}
              style={{ width: 88, height: 88, borderRadius: radius.sm }}
              contentFit="cover"
              accessibilityLabel={p.caption ?? `Photo of ${item.area}`}
            />
          ))}
        </View>
      ) : null}
      {editable ? (
        <Button
          label="Add photo"
          variant="outline"
          size="sm"
          icon={<Camera size={14} color={colors.foreground} />}
          loading={upload.isPending}
          loadingLabel="Uploading…"
          disabled={upload.isPending}
          onPress={addPhoto}
        />
      ) : null}
    </Card>
  );
}

function AddAreaForm({ inspectionId }: { inspectionId: string }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [area, setArea] = useState('');
  const [condition, setCondition] = useState<InspectionCondition>('GOOD');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');

  const add = useMutation({
    mutationFn: () =>
      managementApi.addInspectionItem(inspectionId, {
        area: area.trim(),
        condition,
        notes: notes.trim() || undefined,
        estimatedCost: Number(cost) > 0 ? Number(cost) : undefined,
      }),
    onSuccess: () => {
      setArea('');
      setCondition('GOOD');
      setNotes('');
      setCost('');
      qc.invalidateQueries({ queryKey: ['management', 'inspections'] });
      toast.show('Area added.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not add that area.'), 'error'),
  });

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.md }}>
      <Text variant="bodyStrong" accessibilityRole="header">
        Add an area
      </Text>
      <TextField
        label="Area"
        placeholder="e.g. Kitchen, Master bedroom"
        value={area}
        onChangeText={setArea}
        editable={!add.isPending}
      />
      <ChipSelect
        label="Condition"
        options={INSPECTION_CONDITIONS.map((c) => ({ value: c, label: CONDITION_LABEL[c] }))}
        value={condition}
        onChange={setCondition}
        disabled={add.isPending}
      />
      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        editable={!add.isPending}
      />
      <NumberField
        currency
        label="Estimated repair cost (optional)"
        value={cost}
        onValueChange={setCost}
        editable={!add.isPending}
      />
      <Button
        label="Add area"
        variant="secondary"
        icon={<Plus size={14} color={colors.secondaryForeground} />}
        loading={add.isPending}
        disabled={!area.trim() || add.isPending}
        onPress={() => add.mutate()}
      />
      <Text variant="caption" color="mutedForeground">
        Add photos to an area once it is saved.
      </Text>
    </Card>
  );
}
