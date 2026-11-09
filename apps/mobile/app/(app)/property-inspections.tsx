import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList, Plus } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DateField,
  EmptyState,
  IconButton,
  ListSkeleton,
  PressableScale,
  QueryState,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  INSPECTION_STATUS_LABEL,
  INSPECTION_STATUS_TONE,
  INSPECTION_TYPE_LABEL,
  INSPECTION_TYPES,
  managementApi,
  type InspectionListItem,
  type InspectionStatus,
  type InspectionType,
} from '@/lib/api/management';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { useMyHomes } from '@/hooks/useMyHomes';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type Filter = 'all' | InspectionStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'COMPLETED', label: 'Done' },
  { value: 'SHARED', label: 'Shared' },
];

export default function PropertyInspections() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);

  const list = useQuery({
    queryKey: qk.management.inspections(filter),
    queryFn: () => managementApi.inspections(filter === 'all' ? undefined : filter, 1, 50),
    // Keep the list (and its filter header) on screen while another filter loads.
    placeholderData: keepPreviousData,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Condition"
        title="Inspections"
        subtitle="Move-in, move-out and routine reports"
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => setCreating(true)}
            accessibilityLabel="New inspection"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={3} variant="card" height={96} />}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={list.data?.items ?? []}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.lg }}>
              <SegmentedControl
                options={FILTERS}
                value={filter}
                onChange={setFilter}
                accessibilityLabel="Filter by status"
              />
            </View>
          }
          renderItem={({ item }: { item: InspectionListItem }) => <InspectionRow item={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => void list.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          // The status filter lives in the header, so an empty result stays inside the list.
          ListEmptyComponent={
            <EmptyState
              icon={<ClipboardList size={32} color={colors.mutedForeground} />}
              title="No inspections"
              description="Record a property's condition with photos, room by room."
              action={<Button label="New inspection" onPress={() => setCreating(true)} />}
            />
          }
        />
      </QueryState>

      <Sheet open={creating} onClose={() => setCreating(false)} title="New inspection">
        <CreateInspectionForm
          key={creating ? 'open' : 'closed'}
          onDone={(id) => {
            setCreating(false);
            router.push(`/(app)/property-inspection/${id}`);
          }}
        />
      </Sheet>
    </View>
  );
}

function InspectionRow({ item: i }: { item: InspectionListItem }) {
  const { spacing } = useTheme();
  const when = i.conductedAt ?? i.scheduledFor ?? i.createdAt;
  return (
    <PressableScale
      onPress={() => router.push(`/(app)/property-inspection/${i.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${INSPECTION_TYPE_LABEL[i.type]} inspection, ${i.propertyTitle ?? 'property'}, ${INSPECTION_STATUS_LABEL[i.status]}`}
      style={{ marginBottom: spacing.sm }}
    >
      <Card padding={spacing.lg} style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {INSPECTION_TYPE_LABEL[i.type]} · {i.propertyTitle ?? 'Property'}
          </Text>
          <Badge
            label={INSPECTION_STATUS_LABEL[i.status]}
            tone={INSPECTION_STATUS_TONE[i.status]}
          />
        </View>
        <Text variant="caption" color="mutedForeground">
          {formatDate(when, 'short')} · {i.itemCount} area{i.itemCount === 1 ? '' : 's'}
          {i.estimatedRemedialCost > 0 ? ` · ${formatNaira(i.estimatedRemedialCost)} remedial` : ''}
        </Text>
      </Card>
    </PressableScale>
  );
}

function CreateInspectionForm({ onDone }: { onDone: (id: string) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [type, setType] = useState<InspectionType>('MOVE_IN');
  const [scheduledFor, setScheduledFor] = useState('');
  const [notes, setNotes] = useState('');

  const create = useMutation({
    mutationFn: () =>
      managementApi.createInspection({
        propertyId: propertyId!,
        type,
        scheduledFor: type === 'ROUTINE' && scheduledFor ? scheduledFor : undefined,
        summaryNotes: notes.trim() || undefined,
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['management', 'inspections'] });
      onDone(created.id);
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not create the inspection.'), 'error'),
  });

  if (homes.isLoading) return <ListSkeleton rows={3} />;

  return (
    <View style={{ gap: spacing.lg }}>
      <ChipSelect
        label="Property"
        options={(homes.data ?? []).map((h) => ({ value: h.id, label: h.name }))}
        value={propertyId}
        onChange={setPropertyId}
        emptyText="Add a property first."
      />
      <ChipSelect
        label="Type"
        options={INSPECTION_TYPES.map((t) => ({ value: t, label: INSPECTION_TYPE_LABEL[t] }))}
        value={type}
        onChange={setType}
      />
      {type === 'ROUTINE' ? (
        <DateField
          label="Scheduled for (optional)"
          value={scheduledFor}
          onChange={setScheduledFor}
        />
      ) : null}
      <TextField
        label="Notes (optional)"
        placeholder="Anything worth recording about this inspection"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <Button
        label="Create inspection"
        loading={create.isPending}
        loadingLabel="Creating…"
        disabled={!propertyId || create.isPending}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
