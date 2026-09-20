import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, Plus, Trash2, Users, X } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  Card,
  Divider,
  EmptyState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  roommatesApi,
  EXPENSE_CATEGORY_LABEL,
  type Roommate,
  type RoommateExpense,
} from '@/lib/api/roommates';
import { AssignTaskSheet } from '@/components/roommates/AssignTaskSheet';
import { InviteRoommateSheet } from '@/components/roommates/InviteRoommateSheet';
import { AddExpenseSheet } from '@/components/roommates/AddExpenseSheet';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { formatDate } from '@/lib/format';

export default function Roommates() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { profile } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [assigningTo, setAssigningTo] = useState<Roommate | null>(null);

  const roommatesQuery = useQuery({ queryKey: qk.renter.roommates, queryFn: roommatesApi.list });
  const invitesQuery = useQuery({
    queryKey: qk.renter.roommateInvites,
    queryFn: roommatesApi.listMyInvites,
  });
  const expensesQuery = useQuery({
    queryKey: qk.renter.roommateExpenses,
    queryFn: roommatesApi.listExpenses,
  });

  const roommates = roommatesQuery.data ?? [];
  const activeRoommates = roommates.filter((r) => r.status === 'active');
  const names = [profile?.legalName, ...activeRoommates.map((r) => r.name)].filter(
    (n): n is string => !!n
  );

  const acceptMutation = useMutation({
    mutationFn: (id: string) => roommatesApi.acceptInvite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.roommateInvites });
      qc.invalidateQueries({ queryKey: qk.renter.roommates });
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not accept this invite.', 'error'),
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => roommatesApi.declineInvite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.roommateInvites }),
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not decline this invite.', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => roommatesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.roommates }),
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not remove this roommate.',
        'error'
      ),
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ id, task }: { id: string; task: string }) => roommatesApi.addTask(id, task),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.roommates }),
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not add that task.', 'error'),
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ id, task }: { id: string; task: string }) => roommatesApi.completeTask(id, task),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.roommates }),
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update that task.', 'error'),
  });

  const confirmRemove = (r: Roommate) => {
    Alert.alert('Remove roommate?', `${r.name} will no longer be part of this household.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(r.id) },
    ]);
  };

  const refetchAll = () => {
    roommatesQuery.refetch();
    invitesQuery.refetch();
    expensesQuery.refetch();
  };

  const isLoading = roommatesQuery.isLoading || invitesQuery.isLoading || expensesQuery.isLoading;
  const totalShare = activeRoommates.reduce((sum, r) => sum + r.sharePercentage, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }}>
          Roommates
        </Text>
        <Pressable
          onPress={() => setInviteOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Invite a roommate"
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={90} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetchAll}
              tintColor={colors.mutedForeground}
            />
          }
        >
          {invitesQuery.data && invitesQuery.data.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="heading">Invites for you</Text>
              {invitesQuery.data.map((inv) => (
                <Card key={inv.id} elevated>
                  <Text variant="bodyStrong">{inv.name}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {inv.email}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                    <Pressable
                      onPress={() => declineMutation.mutate(inv.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <X size={13} color={colors.mutedForeground} />
                      <Text variant="caption" color="mutedForeground">
                        Decline
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => acceptMutation.mutate(inv.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        backgroundColor: colors.primary,
                      }}
                    >
                      <Check size={13} color={colors.primaryForeground} />
                      <Text
                        variant="caption"
                        style={{ color: colors.primaryForeground, fontWeight: '600' }}
                      >
                        Accept
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="heading">Household</Text>
              {activeRoommates.length > 0 ? (
                <Text
                  variant="caption"
                  color={totalShare > 100 ? 'destructive' : 'mutedForeground'}
                >
                  {totalShare}% allocated
                </Text>
              ) : null}
            </View>
            {roommates.length === 0 ? (
              <EmptyState
                icon={<Users size={34} color={colors.mutedForeground} />}
                title="No roommates yet"
                description="Invite someone to split rent and shared expenses."
              />
            ) : (
              roommates.map((r) => (
                <Card key={r.id} elevated>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Avatar name={r.name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{r.name}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {r.email}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Badge
                        label={r.status === 'active' ? 'Active' : 'Pending'}
                        tone={r.status === 'active' ? 'success' : 'warning'}
                      />
                      {r.status === 'active' ? (
                        <Text variant="caption" color="mutedForeground">
                          {r.sharePercentage}% of rent
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                    {r.responsibilities.map((task) => (
                      <Pressable
                        key={task}
                        onPress={() => completeTaskMutation.mutate({ id: r.id, task })}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      >
                        <View
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            borderWidth: 1.5,
                            borderColor: colors.border,
                          }}
                        />
                        <Text variant="caption" color="mutedForeground">
                          {task}
                        </Text>
                      </Pressable>
                    ))}

                    <Pressable
                      onPress={() => setAssigningTo(r)}
                      accessibilityRole="button"
                      accessibilityLabel={`Assign a task to ${r.name}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} color={colors.primary} />
                      <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                        Assign a task
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => confirmRemove(r)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: spacing.sm,
                      alignSelf: 'flex-start',
                    }}
                    hitSlop={8}
                  >
                    <Trash2 size={13} color={colors.destructive} />
                    <Text variant="caption" color="destructive">
                      Remove
                    </Text>
                  </Pressable>
                </Card>
              ))
            )}
          </View>

          <View style={{ gap: spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="heading">Shared expenses</Text>
              <Pressable onPress={() => setExpenseOpen(true)} hitSlop={8}>
                <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
                  Add
                </Text>
              </Pressable>
            </View>
            {!expensesQuery.data?.length ? (
              <Text variant="callout" color="mutedForeground">
                No shared expenses logged yet.
              </Text>
            ) : (
              <Card elevated padding="none">
                {expensesQuery.data.map((e: RoommateExpense, i) => (
                  <View key={e.id}>
                    {i > 0 ? <Divider /> : null}
                    <View style={{ padding: spacing.lg }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text variant="callout" style={{ fontWeight: '700' }}>
                          {e.description}
                        </Text>
                        <Price amount={e.amount} variant="callout" />
                      </View>
                      <Text variant="caption" color="mutedForeground">
                        {EXPENSE_CATEGORY_LABEL[e.category]} · Paid by {e.paidBy} ·{' '}
                        {formatDate(e.date, 'short')}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        Split: {e.splitAmong.join(', ')}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </View>
        </ScrollView>
      )}

      <AssignTaskSheet
        open={!!assigningTo}
        onClose={() => setAssigningTo(null)}
        roommate={assigningTo}
        onSubmit={(task) => addTaskMutation.mutate({ id: assigningTo!.id, task })}
        submitting={addTaskMutation.isPending}
      />

      <InviteRoommateSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <AddExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} names={names} />
    </View>
  );
}
