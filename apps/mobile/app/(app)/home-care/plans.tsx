import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, CheckCircle2, Plus } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  DateField,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  CATEGORIES,
  categoryLabel,
  homeCareApi,
  type Category,
  type Plan,
} from '@/lib/api/homeCare';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { daysUntil } from '@/lib/api/hostShortlets';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { StatusPill } from '@/components/host/HostUI';
import { VendorPicker } from '@/components/homecare/VendorPicker';

const FREQUENCIES = [
  { days: 30, label: 'Monthly' },
  { days: 90, label: 'Every 3 months' },
  { days: 182, label: 'Every 6 months' },
  { days: 365, label: 'Yearly' },
];

const everyLabel = (d: number) => FREQUENCIES.find((f) => f.days === d)?.label ?? `Every ${d} days`;

/** Servicing on a schedule, so things are fixed before they break. */
export default function Plans() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const query = useQuery({ queryKey: qk.homeCare.plans, queryFn: () => homeCareApi.plans() });
  const plans = [...(query.data?.items ?? [])]
    .filter((p) => p.status === 'ACTIVE')
    .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt));
  const complete = useMutation({
    mutationFn: (p: Plan) => homeCareApi.completePlan(p.id),
    onSuccess: (next) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['home-care'] });
      toast.show(`Done. Next due ${formatDate(next.nextDueAt, 'medium')}.`, 'success');
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Could not record it.', 'error'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Home care"
          title="Preventive maintenance"
          subtitle="Servicing before things break"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Add a plan"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setAdding(true)}
            />
          }
        />
        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton height={100} radius={radius.lg} />
        ) : !plans.length ? (
          <EmptyState
            icon={<CalendarClock size={34} color={colors.mutedForeground} />}
            title="No plans yet"
            description="Service the AC every 3 months, the generator monthly — set it once and it’s tracked."
            action={<Button label="Add a plan" onPress={() => setAdding(true)} />}
          />
        ) : (
          plans.map((p) => {
            const days = daysUntil(p.nextDueAt);
            const due =
              days < 0
                ? `Overdue by ${-days} day${days === -1 ? '' : 's'}`
                : days === 0
                  ? 'Due today'
                  : `Due in ${days} day${days === 1 ? '' : 's'}`;
            return (
              <Card key={p.id} elevated style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{p.title}</Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {categoryLabel(p.category)} · {everyLabel(p.frequencyDays)}
                      {p.asset?.name ? ` · ${p.asset.name}` : ''}
                    </Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {p.property?.title ?? p.property?.name ?? ''}
                      {p.assignedVendor?.name ? ` · ${p.assignedVendor.name}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <StatusPill
                    label={due}
                    tone={days < 0 ? 'danger' : days <= 7 ? 'warning' : 'neutral'}
                  />
                  <View style={{ flex: 1 }} />
                  <Button
                    label="Mark done"
                    size="sm"
                    variant={days <= 7 ? 'primary' : 'secondary'}
                    icon={<CheckCircle2 size={15} />}
                    loading={complete.isPending && complete.variables?.id === p.id}
                    onPress={() =>
                      Alert.alert(
                        `Record “${p.title}” as done?`,
                        `The next one is scheduled ${everyLabel(p.frequencyDays).toLowerCase()} from today.`,
                        [
                          { text: 'Not yet', style: 'cancel' },
                          { text: 'Mark done', onPress: () => complete.mutate(p) },
                        ]
                      )
                    }
                  />
                </View>
                {p.lastCompletedAt ? (
                  <Text variant="caption" color="mutedForeground">
                    Last done {formatDate(p.lastCompletedAt, 'medium')}
                  </Text>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>
      <Sheet open={adding} onClose={() => setAdding(false)} title="New maintenance plan">
        {adding ? <AddPlan onDone={() => setAdding(false)} /> : null}
      </Sheet>
    </View>
  );
}

function AddPlan({ onDone }: { onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState(homes.data?.[0]?.id ?? '');
  const [assetId, setAssetId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('APPLIANCES');
  const [frequency, setFrequency] = useState(90);
  const [firstDue, setFirstDue] = useState(() => toISODate(new Date(Date.now() + 7 * 86_400_000)));
  const [vendorId, setVendorId] = useState<string | undefined>();
  const assets = useQuery({
    queryKey: qk.homeCare.assets(propertyId),
    queryFn: () => homeCareApi.assets(propertyId),
    enabled: !!propertyId,
  });
  const add = useMutation({
    mutationFn: () =>
      homeCareApi.addPlan({
        propertyId,
        assetId,
        title: title.trim(),
        category,
        frequencyDays: frequency,
        nextDueAt: new Date(`${firstDue}T09:00:00`).toISOString(),
        assignedVendorId: vendorId,
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['home-care'] });
      toast.show('Plan added.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(homes.data ?? []).map((h) => (
            <Chip
              key={h.id}
              label={h.name}
              size="sm"
              selected={propertyId === h.id}
              onPress={() => {
                setPropertyId(h.id);
                setAssetId(undefined);
              }}
            />
          ))}
        </View>
        {assets.data?.items.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {assets.data.items.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                size="sm"
                selected={assetId === a.id}
                onPress={() => {
                  setAssetId(assetId === a.id ? undefined : a.id);
                  if (!title) setTitle(`Service ${a.name.toLowerCase()}`);
                }}
              />
            ))}
          </View>
        ) : null}
        <TextField
          label="What to do"
          value={title}
          onChangeText={setTitle}
          hint="e.g. Service the generator"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              size="sm"
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {FREQUENCIES.map((f) => (
            <Chip
              key={f.days}
              label={f.label}
              selected={frequency === f.days}
              onPress={() => setFrequency(f.days)}
            />
          ))}
        </View>
        <DateField
          label="First due"
          value={firstDue}
          onChange={setFirstDue}
          min={toISODate(new Date())}
        />
        <VendorPicker value={vendorId} onChange={setVendorId} optional />
        {add.error ? (
          <FormAlert
            message={add.error instanceof ApiError ? add.error.message : 'Could not add the plan.'}
          />
        ) : null}
        <Button
          label="Add plan"
          disabled={!propertyId || !title.trim()}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
