import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, SlidersHorizontal, WalletCards } from 'lucide-react-native';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DueRow, confirmPaid, errorText } from '@/components/estate/EstateUI';
import { Stepper } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import { estateManagerApi, type Due, type ManagedEstate } from '@/lib/api/estateManager';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

type View_ = 'OVERDUE' | 'PENDING' | 'PROCESSING' | 'PAID' | 'all';
const VIEWS: { value: View_; label: string }[] = [
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PENDING', label: 'Due' },
  // Being paid online right now: check here before marking one paid by hand.
  { value: 'PROCESSING', label: 'Paying now' },
  { value: 'PAID', label: 'Paid' },
  { value: 'all', label: 'All' },
];
const isView = (v?: string): v is View_ => VIEWS.some((x) => x.value === v);

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

export default function EstateDues() {
  const params = useLocalSearchParams<{ view?: string; settings?: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<View_>(isView(params.view) ? params.view : 'OVERDUE');
  const [settingsOpen, setSettingsOpen] = useState(params.settings === '1');

  const query = useInfiniteQuery({
    queryKey: qk.estateManager.dues(estateId, view),
    queryFn: ({ pageParam }) =>
      estateManagerApi.dues(estateId, {
        page: pageParam,
        status: view === 'all' ? undefined : view,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<Due[]>(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;

  const pay = useMutation({
    mutationFn: (d: Due) => estateManagerApi.markDuePaid(estateId, d.id),
    onSuccess: (_saved, d) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.estate(estateId) });
      toast.show(`${d.unitLabel} marked paid.`, 'success');
    },
    onError: (e) => {
      void haptics.error();
      qc.invalidateQueries({ queryKey: qk.estateManager.estate(estateId) });
      toast.show(errorText(e, 'Could not record that payment.'), 'error');
    },
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text variant="title" accessibilityRole="header">
              Dues
            </Text>
            <Text variant="callout" color="mutedForeground">
              {query.data
                ? `${total.toLocaleString('en-NG')} ${VIEWS.find((v) => v.value === view)!.label.toLowerCase()}${view === 'all' ? ' charges' : ''}`
                : 'Service charges, levies and rent'}
            </Text>
          </View>
          <IconButton
            accessibilityLabel="Late fee rules"
            disabled={!estate}
            icon={<SlidersHorizontal size={19} color={colors.foreground} />}
            onPress={() => setSettingsOpen(true)}
          />
          <IconButton
            accessibilityLabel="Charge dues"
            disabled={!estateId}
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => router.push('/(app)/estate-charge')}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {VIEWS.map((v) => (
            <Chip
              key={v.value}
              label={v.label}
              selected={view === v.value}
              onPress={() => setView(v.value)}
            />
          ))}
        </ScrollView>
      </View>

      {!estateId ? (
        <EmptyState
          icon={<WalletCards size={34} color={colors.mutedForeground} />}
          title="No estate yet"
          description="Dues appear here once your estate is set up."
        />
      ) : query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(d) => d.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: Due }) => (
            <DueRow
              d={item}
              paying={pay.isPending && pay.variables?.id === item.id}
              onPaid={() => confirmPaid(item, () => pay.mutate(item))}
            />
          )}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={{ paddingTop: spacing.md }}>
                <Skeleton height={104} radius={radius.lg} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={<WalletCards size={34} color={colors.mutedForeground} />}
              title={
                view === 'OVERDUE'
                  ? 'Nothing overdue'
                  : view === 'PENDING'
                    ? 'Nothing waiting to be paid'
                    : view === 'PAID'
                      ? 'No payments yet'
                      : view === 'PROCESSING'
                        ? 'No payments going through'
                        : 'No charges yet'
              }
              description={
                view === 'OVERDUE'
                  ? 'Every household is up to date.'
                  : view === 'PROCESSING'
                    ? 'Dues a resident is paying online show here until the payment clears.'
                    : 'Charge a service fee or levy to every home, or to the ones you pick.'
              }
              action={
                view === 'OVERDUE' || view === 'PAID' || view === 'PROCESSING' ? undefined : (
                  <Button label="Charge dues" onPress={() => router.push('/(app)/estate-charge')} />
                )
              }
            />
          }
        />
      )}

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Late fee rules">
        {settingsOpen && estate ? (
          <LateFeeForm estate={estate} onDone={() => setSettingsOpen(false)} />
        ) : null}
      </Sheet>
    </View>
  );
}

function LateFeeForm({ estate, onDone }: { estate: ManagedEstate; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [fee, setFee] = useState(String(estate.lateFeeAmount || ''));
  const [grace, setGrace] = useState(estate.graceDays ?? 0);
  const amount = Number(fee.replace(/\D/g, '')) || 0;
  const save = useMutation({
    mutationFn: () =>
      estateManagerApi.updateDueSettings(estate.id, { lateFeeAmount: amount, graceDays: grace }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.estates });
      toast.show('Late fee rules saved.', 'success');
      onDone();
    },
  });
  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label="Late fee (₦)"
        keyboardType="number-pad"
        value={amount ? amount.toLocaleString('en-NG') : ''}
        onChangeText={setFee}
        placeholder="0"
        hint="Added once when a due becomes late. Leave empty for no late fee."
      />
      <Stepper
        label="Grace period"
        hint="Days after the due date before it counts as late"
        value={grace}
        min={0}
        max={60}
        suffix={grace === 1 ? ' day' : ' days'}
        onChange={setGrace}
      />
      <FormAlert
        tone="info"
        message={
          amount
            ? `A due unpaid ${grace ? `${grace} day${grace === 1 ? '' : 's'} after` : 'on'} its due date becomes overdue and ${naira(amount)} is added. It applies from now on, not to dues already late.`
            : 'With no late fee, an unpaid due is still marked overdue, with nothing added.'
        }
      />
      {save.error ? <FormAlert message={errorText(save.error, 'Could not save.')} /> : null}
      <Button label="Save rules" loading={save.isPending} onPress={() => save.mutate()} />
    </View>
  );
}
