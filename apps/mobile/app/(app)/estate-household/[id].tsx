import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, Link2, Pencil, WalletCards } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import {
  DueRow,
  HouseholdSheet,
  LinkResidentSheet,
  confirmPaid,
  errorText,
} from '@/components/estate/EstateUI';
import { StatusPill } from '@/components/host/HostUI';
import { ContactActions } from '@/components/realtor/RealtorUI';
import { useEstate } from '@/hooks/useEstate';
import { estateManagerApi, owed, type Due } from '@/lib/api/estateManager';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

/** One home: how to reach the resident, what they owe, and their account link. */
export default function EstateHousehold() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estateId } = useEstate();
  const [sheet, setSheet] = useState<'edit' | 'link' | null>(null);

  const household = useQuery({
    queryKey: qk.estateManager.household(estateId, id),
    queryFn: () => estateManagerApi.household(estateId, id),
    enabled: !!estateId,
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const dues = useQuery({
    queryKey: qk.estateManager.householdDues(estateId, id),
    queryFn: () => estateManagerApi.dues(estateId, { householdId: id, pageSize: 100 }),
    enabled: !!estateId,
  });
  const h = household.data;
  const list = dues.data?.items ?? [];
  const balance = owed(list);
  const open = list.filter((d) => d.status !== 'paid' && d.status !== 'waived');
  const settled = list.filter((d) => d.status === 'paid' || d.status === 'waived');

  const done = (message: string) => {
    void haptics.success();
    qc.invalidateQueries({ queryKey: qk.estateManager.estate(estateId) });
    toast.show(message, 'success');
  };
  const failed = (fallback: string) => (e: unknown) => {
    void haptics.error();
    toast.show(errorText(e, fallback), 'error');
  };

  const pay = useMutation({
    mutationFn: (d: Due) => estateManagerApi.markDuePaid(estateId, d.id),
    onSuccess: () => done('Payment recorded.'),
    onError: (e) => {
      qc.invalidateQueries({ queryKey: qk.estateManager.estate(estateId) });
      failed('Could not record that payment.')(e);
    },
  });
  const setStatus = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') =>
      estateManagerApi.updateHousehold(estateId, id, { status }),
    onSuccess: (_h, status) =>
      done(status === 'INACTIVE' ? 'Marked inactive.' : 'Household is active again.'),
    onError: failed('Could not update this household.'),
  });
  const unlink = useMutation({
    mutationFn: () => estateManagerApi.unlinkResident(estateId, id),
    onSuccess: () => done('Account unlinked.'),
    onError: failed('Could not unlink the account.'),
  });
  const remove = useMutation({
    mutationFn: () => estateManagerApi.removeHousehold(estateId, id),
    onSuccess: () => {
      done('Household removed.');
      router.back();
    },
    onError: failed('Could not remove this household.'),
  });

  const notFound = household.error instanceof ApiError && household.error.status === 404;
  const inactive = h?.status === 'inactive';
  // Removal is only for a row added by mistake: nothing charged, nobody linked.
  const removable = !!h && !h.residentLinked && dues.isSuccess && list.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={household.isRefetching || dues.isRefetching}
            onRefresh={() => {
              void household.refetch();
              void dues.refetch();
            }}
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
          eyebrow="Household"
          title={h?.unitLabel ?? 'Household'}
          onBack={() => router.back()}
          accessory={
            h ? (
              <IconButton
                accessibilityLabel="Edit household"
                icon={<Pencil size={18} color={colors.foreground} />}
                onPress={() => setSheet('edit')}
              />
            ) : null
          }
        />

        {notFound ? (
          <EmptyState
            title="Household not found"
            description="It may have been removed, or it belongs to another estate."
          />
        ) : household.isError && !h ? (
          <ErrorState onRetry={() => household.refetch()} />
        ) : !h ? (
          <Skeleton height={180} radius={radius.lg} />
        ) : (
          <>
            <Card elevated style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={h.residentName} size={52} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{h.residentName}</Text>
                  <Text variant="caption" color="mutedForeground" selectable>
                    {[h.contactPhone, h.contactEmail].filter(Boolean).join(' · ') ||
                      'No contact details yet'}
                  </Text>
                </View>
                {inactive ? <StatusPill label="Inactive" tone="neutral" /> : null}
              </View>
              <ContactActions phone={h.contactPhone} email={h.contactEmail} name={h.residentName} />
            </Card>

            <Card elevated style={{ gap: spacing.xs }}>
              <Text variant="caption" color="mutedForeground">
                Owes now
              </Text>
              {dues.isPending ? (
                <Skeleton height={30} width="45%" />
              ) : (
                <Price amount={balance.total} variant="title" />
              )}
              <Text
                variant="caption"
                style={{ color: balance.overdue ? colors.destructive : colors.mutedForeground }}
              >
                {dues.isPending
                  ? ' '
                  : balance.overdue
                    ? `₦${Math.round(balance.overdue).toLocaleString('en-NG')} of it is overdue`
                    : balance.count
                      ? `${balance.count} open ${balance.count === 1 ? 'charge' : 'charges'}, none late`
                      : 'All paid up'}
              </Text>
              {!inactive ? (
                <Button
                  label="Charge this household"
                  variant="secondary"
                  icon={<WalletCards size={16} color={colors.foreground} />}
                  style={{ marginTop: spacing.sm }}
                  onPress={() =>
                    router.push({ pathname: '/(app)/estate-charge', params: { householdId: h.id } })
                  }
                />
              ) : null}
            </Card>

            <Card elevated style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                {h.residentLinked ? (
                  <BadgeCheck size={18} color={colors.success} />
                ) : (
                  <Link2 size={18} color={colors.mutedForeground} />
                )}
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {h.residentLinked ? 'GetRentos account linked' : 'No GetRentos account linked'}
                </Text>
              </View>
              <Text variant="caption" color="mutedForeground">
                {h.residentLinked
                  ? 'They pay dues, invite visitors and get your announcements in their own app.'
                  : 'Link their account so they can pay online and invite visitors themselves.'}
              </Text>
              {h.residentLinked ? (
                <Button
                  label="Unlink account"
                  variant="ghost"
                  loading={unlink.isPending}
                  onPress={() =>
                    Alert.alert(
                      'Unlink this account?',
                      `${h.residentName} will stop seeing this home’s dues, passes and announcements.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Unlink', style: 'destructive', onPress: () => unlink.mutate() },
                      ]
                    )
                  }
                />
              ) : (
                <Button
                  label="Link an account"
                  variant="secondary"
                  onPress={() => setSheet('link')}
                />
              )}
            </Card>

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading" accessibilityRole="header">
                Dues
              </Text>
              {dues.isPending ? (
                <Skeleton height={100} radius={radius.lg} />
              ) : dues.isError ? (
                <ErrorState onRetry={() => dues.refetch()} />
              ) : !list.length ? (
                <Text variant="callout" color="mutedForeground">
                  Nothing charged to this home yet.
                </Text>
              ) : (
                <>
                  {open.map((d) => (
                    <DueRow
                      key={d.id}
                      d={d}
                      showHousehold={false}
                      paying={pay.isPending && pay.variables?.id === d.id}
                      onPaid={() => confirmPaid(d, () => pay.mutate(d))}
                    />
                  ))}
                  {settled.slice(0, 12).map((d) => (
                    <DueRow key={d.id} d={d} showHousehold={false} />
                  ))}
                </>
              )}
            </View>

            <View style={{ gap: spacing.sm }}>
              <Button
                label={inactive ? 'Mark active again' : 'Mark inactive (moved out)'}
                variant="outline"
                loading={setStatus.isPending}
                onPress={() =>
                  inactive
                    ? setStatus.mutate('ACTIVE')
                    : Alert.alert(
                        'Mark this household inactive?',
                        'Use this when the resident moves out. New charges and announcements skip it, and its payment history is kept.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Mark inactive', onPress: () => setStatus.mutate('INACTIVE') },
                        ]
                      )
                }
              />
              {removable ? (
                <Button
                  label="Remove household"
                  variant="ghost"
                  loading={remove.isPending}
                  onPress={() =>
                    Alert.alert('Remove this household?', 'For a home added by mistake.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate() },
                    ])
                  }
                />
              ) : null}
            </View>
            <Text variant="caption" color="mutedForeground" center>
              Added {formatDate(h.createdAt, 'medium')}
            </Text>
          </>
        )}
      </ScrollView>
      {h ? (
        <>
          <HouseholdSheet
            open={sheet === 'edit'}
            onClose={() => setSheet(null)}
            estateId={estateId}
            household={h}
          />
          <LinkResidentSheet
            open={sheet === 'link'}
            onClose={() => setSheet(null)}
            estateId={estateId}
            household={h}
          />
        </>
      ) : null}
    </View>
  );
}
