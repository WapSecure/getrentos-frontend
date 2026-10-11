import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Car, Plus, ShieldBan, UserRound } from 'lucide-react-native';
import {
  Button,
  Card,
  DateField,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { ReasonSheet } from '@/components/homecare/ReasonSheet';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import {
  estateManagerApi,
  isLapsedWatchlistEntry,
  normalisePlate,
  type WatchlistEntry,
  type WatchlistSeverity,
  type WatchlistSubjectType,
} from '@/lib/api/estateManager';
import type { PickedFile } from '@/lib/api/documents';
import { pickPhoto } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

type View_ = 'ACTIVE' | 'LIFTED' | 'ALL';

/**
 * People and vehicles the gate should stop or flag. Lifted entries are kept,
 * so the estate can still say who was on the list, when, and who decided.
 */
export default function EstateWatchlist() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<View_>('ACTIVE');
  const [adding, setAdding] = useState(false);
  const [lifting, setLifting] = useState<WatchlistEntry | null>(null);

  const query = useInfiniteQuery({
    queryKey: qk.estateManager.watchlist(estateId, view),
    queryFn: ({ pageParam }) =>
      estateManagerApi.watchlist(estateId, view === 'ALL' ? undefined : view, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<WatchlistEntry[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  const lift = useMutation({
    mutationFn: (v: { entry: WatchlistEntry; reason: string }) =>
      estateManagerApi.liftWatchlistEntry(estateId, v.entry.id, v.reason),
    onSuccess: (_e, v) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'watchlist'] });
      toast.show(`${v.entry.label} is off the list.`, 'success');
      setLifting(null);
    },
    onError: (e) => toast.show(errorText(e, 'Could not lift this entry.'), 'error'),
  });

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Gate'}
          title="Watch list"
          subtitle="Who the gate should stop or flag"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Add to the watch list"
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setAdding(true)}
            />
          }
        />
        <SegmentedControl
          accessibilityLabel="Which entries"
          value={view}
          onChange={setView}
          options={[
            { value: 'ACTIVE', label: 'On the list' },
            { value: 'LIFTED', label: 'Lifted' },
            { value: 'ALL', label: 'All' },
          ]}
        />
      </View>

      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={132} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(e) => e.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: WatchlistEntry }) => {
            const block = item.severity === 'BLOCK';
            const vehicle = item.subjectType === 'VEHICLE';
            return (
              <Card elevated style={{ gap: spacing.sm }}>
                <View
                  accessible
                  accessibilityLabel={`${item.label}, ${vehicle ? 'vehicle' : 'person'}, ${block ? 'refuse entry' : 'admit and tell the office'}. ${item.reason}`}
                  style={{ flexDirection: 'row', gap: spacing.md }}
                >
                  {item.photoUrl ? (
                    <Image
                      source={{ uri: item.photoUrl }}
                      contentFit="cover"
                      accessible={false}
                      style={{ width: 56, height: 56, borderRadius: radius.md }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: radius.md,
                        backgroundColor: colors.secondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {vehicle ? (
                        <Car size={22} color={colors.mutedForeground} />
                      ) : (
                        <UserRound size={22} color={colors.mutedForeground} />
                      )}
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {[item.plateNumber, item.phone].filter(Boolean).join(' · ') ||
                        (vehicle ? 'No registration recorded' : 'Matched by name')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                      {isLapsedWatchlistEntry(item) ? (
                        // Past its end date: the gate no longer acts on it.
                        <StatusPill label="Not enforced" tone="neutral" />
                      ) : item.status === 'LIFTED' ? (
                        <StatusPill label="Lifted" tone="neutral" />
                      ) : (
                        <StatusPill
                          label={block ? 'Refuse entry' : 'Admit, tell office'}
                          tone={block ? 'danger' : 'warning'}
                        />
                      )}
                    </View>
                  </View>
                </View>
                <Text variant="callout">{item.reason}</Text>
                <Text variant="caption" color="mutedForeground">
                  Added {formatDate(item.createdAt, 'medium')}
                  {item.expiresAt
                    ? isLapsedWatchlistEntry(item)
                      ? ` · ended ${formatDate(item.expiresAt, 'medium')}`
                      : ` · until ${formatDate(item.expiresAt, 'medium')}`
                    : ''}
                  {item.liftedAt ? ` · lifted ${formatDate(item.liftedAt, 'medium')}` : ''}
                </Text>
                {item.liftReason ? (
                  <Text variant="caption" color="mutedForeground">
                    Lifted because: {item.liftReason}
                  </Text>
                ) : null}
                {item.status === 'ACTIVE' ? (
                  <Button
                    label="Take off the list"
                    size="sm"
                    variant="ghost"
                    accessibilityLabel={`Take ${item.label} off the watch list`}
                    onPress={() => setLifting(item)}
                  />
                ) : null}
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<ShieldBan size={34} color={colors.mutedForeground} />}
              title={view === 'LIFTED' ? 'Nothing lifted yet' : 'Nobody on the watch list'}
              description={
                view === 'LIFTED'
                  ? 'Entries you take off the list are kept here as a record.'
                  : 'Add a person or a vehicle and every gate checks arrivals against it.'
              }
              action={
                view !== 'LIFTED' ? (
                  <Button label="Add to the watch list" onPress={() => setAdding(true)} />
                ) : undefined
              }
            />
          }
        />
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add to the watch list">
        {adding ? <AddForm estateId={estateId} onDone={() => setAdding(false)} /> : null}
      </Sheet>
      <ReasonSheet
        open={!!lifting}
        title={lifting ? `Take ${lifting.label} off the list` : ''}
        hint="Why it’s being lifted. Kept with the entry as a record."
        action="Lift entry"
        min={10}
        busy={lift.isPending}
        onClose={() => setLifting(null)}
        onConfirm={(reason) => lifting && lift.mutate({ entry: lifting, reason })}
      />
    </View>
  );
}

function AddForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [subjectType, setSubjectType] = useState<WatchlistSubjectType>('PERSON');
  const [severity, setSeverity] = useState<WatchlistSeverity>('BLOCK');
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [reason, setReason] = useState('');
  const [expires, setExpires] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);
  const vehicle = subjectType === 'VEHICLE';

  const save = useMutation({
    mutationFn: () =>
      estateManagerApi.addToWatchlist(estateId, {
        label: label.trim(),
        reason: reason.trim(),
        subjectType,
        severity,
        phone: !vehicle && phone.trim() ? phone.trim() : undefined,
        plateNumber: vehicle && plate.trim() ? normalisePlate(plate) : undefined,
        // Through the end of the chosen day.
        expiresAt: expires ? new Date(`${expires}T23:59:00`).toISOString() : undefined,
        photo,
      }),
    onSuccess: (entry) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'watchlist'] });
      toast.show(`${entry.label} added. Every gate checks against it now.`, 'success');
      onDone();
    },
  });

  // A vehicle is only recognisable by its plate; a person by name, better with a phone.
  const ready =
    label.trim().length >= 2 &&
    reason.trim().length >= 10 &&
    (!vehicle || normalisePlate(plate).length >= 4);

  return (
    <View style={{ gap: spacing.md }}>
      <SegmentedControl
        accessibilityLabel="Person or vehicle"
        value={subjectType}
        onChange={setSubjectType}
        options={[
          { value: 'PERSON', label: 'Person' },
          { value: 'VEHICLE', label: 'Vehicle' },
        ]}
      />
      <TextField
        label={vehicle ? 'Vehicle (make, colour)' : 'Full name'}
        value={label}
        onChangeText={setLabel}
        maxLength={120}
        placeholder={vehicle ? 'e.g. Grey Toyota Corolla' : undefined}
      />
      {vehicle ? (
        <TextField
          label="Registration"
          value={plate}
          onChangeText={setPlate}
          autoCapitalize="characters"
          maxLength={20}
          hint="Matched ignoring spaces and dashes"
        />
      ) : (
        <TextField
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={30}
          hint="A number is a surer match than a name, which other people share"
        />
      )}
      <SegmentedControl
        accessibilityLabel="What the gate should do"
        value={severity}
        onChange={setSeverity}
        options={[
          { value: 'BLOCK', label: 'Refuse entry' },
          { value: 'WATCH', label: 'Admit, tell office' },
        ]}
      />
      <TextField
        label="Why"
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={300}
        hint="The guard sees this when there’s a match. At least 10 characters."
      />
      <DateField
        label="Until (optional)"
        value={expires}
        onChange={setExpires}
        min={toISODate(new Date())}
      />
      <Pressable
        onPress={async () => setPhoto((await pickPhoto()) ?? photo)}
        accessibilityRole="button"
        accessibilityLabel={photo ? 'Photo attached. Choose another' : 'Add a photo, optional'}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.border,
        }}
      >
        <Camera size={18} color={colors.mutedForeground} />
        <Text
          variant="callout"
          color={photo ? 'foreground' : 'mutedForeground'}
          style={{ flex: 1 }}
        >
          {photo ? 'Photo attached' : 'Add a photo (optional)'}
        </Text>
      </Pressable>
      <FormAlert
        tone="warning"
        message="This affects a real person at your gate. Add someone only on something you can stand behind, and say why plainly."
      />
      {save.error ? (
        <FormAlert message={errorText(save.error, 'Could not add this entry.')} />
      ) : null}
      <Button
        label="Add to the watch list"
        disabled={!ready}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
