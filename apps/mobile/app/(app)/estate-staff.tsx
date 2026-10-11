import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Plus, ShieldCheck } from 'lucide-react-native';
import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { AddGatemanSheet, StaffRow } from '@/components/estate/staff-setup/StaffUI';
import { useEstate } from '@/hooks/useEstate';
import {
  estateStaffSetupApi,
  staffCount,
  staffSetupKeys,
  type StaffMember,
} from '@/lib/api/estateStaffSetup';
import { haptics } from '@/lib/haptics';

/** The estate's gatemen: who can check visitors in, add one, or take one off the gate. */
export default function EstateStaff() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId, isPending: estatePending } = useEstate();
  const [adding, setAdding] = useState(false);

  const query = useInfiniteQuery({
    queryKey: staffSetupKeys.staff(estateId),
    queryFn: ({ pageParam }) => estateStaffSetupApi.staff(estateId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<StaffMember[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages[0]?.total ?? 0;

  const remove = useMutation({
    mutationFn: (m: StaffMember) => estateStaffSetupApi.removeGateman(estateId, m.userId),
    onSuccess: (_, m) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: staffSetupKeys.staff(estateId) });
      toast.show(`${m.name} is no longer a gateman here.`, 'success');
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: staffSetupKeys.staff(estateId) });
      toast.show(errorText(e, 'Could not remove this gateman.'), 'error');
    },
  });

  const confirmRemove = (m: StaffMember) =>
    Alert.alert(
      `Remove ${m.name}?`,
      `They will no longer be able to check visitors in${estate ? ` at ${estate.name}` : ''}. You can add them again at any time.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(m) },
      ]
    );

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
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Estate'}
          title="Staff"
          subtitle={query.data ? staffCount(total) : 'Your gatemen'}
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Add a gateman"
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setAdding(true)}
            />
          }
        />
      </View>

      {!estatePending && !estate ? (
        <EmptyState
          icon={<Building2 size={34} color={colors.mutedForeground} />}
          title="No estate yet"
          description="Set your estate up first, then add the gatemen who run its gates."
          action={
            <Button label="Set up your estate" onPress={() => router.push('/(app)/estate-setup')} />
          }
        />
      ) : query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState title="We couldn’t load your staff" onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={84} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(m) => m.userId}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={
            items.length ? (
              <Text variant="caption" color="mutedForeground" style={{ marginBottom: spacing.md }}>
                Gatemen verify visitor passes and log arrivals at your gates using their own
                GetRentos account.
              </Text>
            ) : null
          }
          renderItem={({ item }: { item: StaffMember }) => (
            <StaffRow
              member={item}
              removing={remove.isPending && remove.variables?.userId === item.userId}
              onRemove={() => confirmRemove(item)}
            />
          )}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={{ marginTop: spacing.md }}>
                <Skeleton height={84} radius={radius.lg} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={<ShieldCheck size={34} color={colors.mutedForeground} />}
              title="No gatemen yet"
              description="Add the people who run your gates. They need a GetRentos account, then they can verify visitor passes from their phone."
              action={<Button label="Add a gateman" onPress={() => setAdding(true)} />}
            />
          }
        />
      )}

      <AddGatemanSheet
        open={adding}
        onClose={() => setAdding(false)}
        estateId={estateId}
        estateName={estate?.name}
      />
    </View>
  );
}
