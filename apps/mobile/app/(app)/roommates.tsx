import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, Plus, Trash2, Users, X } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  LinkButton,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { useOptimisticMutation } from '@/lib/query/optimistic';
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

  // Ticking a task off removes it at once; it comes back if the server says no.
  const completeTaskMutation = useOptimisticMutation({
    mutationFn: ({ id, task }: { id: string; task: string }) => roommatesApi.completeTask(id, task),
    patches: ({ id, task }) => [
      {
        queryKey: qk.renter.roommates,
        update: (old) =>
          (old as Roommate[]).map((r) =>
            r.id === id
              ? { ...r, responsibilities: r.responsibilities.filter((t) => t !== task) }
              : r
          ),
      },
    ],
    errorMessage: 'Could not update that task.',
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
        <IconButton
          variant="ghost"
          accessibilityLabel="Back"
          icon={<ChevronLeft size={24} color={colors.foreground} />}
          onPress={() => router.back()}
        />
        <Text variant="title" style={{ flex: 1 }}>
          Roommates
        </Text>
        <IconButton
          accessibilityLabel="Invite a roommate"
          icon={<Plus size={20} color={colors.primary} />}
          onPress={() => setInviteOpen(true)}
        />
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={90} radius={radius.lg} />
          ))}
        </View>
      ) : roommatesQuery.isError && !roommatesQuery.data ? (
        <ErrorState onRetry={refetchAll} />
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
                    <Button
                      label="Decline"
                      size="sm"
                      variant="outline"
                      fullWidth={false}
                      icon={<X size={14} color={colors.mutedForeground} />}
                      loading={declineMutation.isPending && declineMutation.variables === inv.id}
                      onPress={() => declineMutation.mutate(inv.id)}
                    />
                    <Button
                      label="Accept"
                      size="sm"
                      fullWidth={false}
                      icon={<Check size={14} color={colors.primaryForeground} />}
                      loading={acceptMutation.isPending && acceptMutation.variables === inv.id}
                      onPress={() => acceptMutation.mutate(inv.id)}
                    />
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
                      <Checkbox
                        key={task}
                        checked={false}
                        onChange={() => completeTaskMutation.mutate({ id: r.id, task })}
                        label={task}
                        accessibilityLabel={`Mark “${task}” done`}
                      />
                    ))}

                    <LinkButton
                      label="Assign a task"
                      icon={<Plus size={14} color={colors.primary} />}
                      accessibilityLabel={`Assign a task to ${r.name}`}
                      onPress={() => setAssigningTo(r)}
                      style={{ alignSelf: 'flex-start' }}
                    />
                  </View>

                  <LinkButton
                    label="Remove"
                    tone="destructive"
                    icon={<Trash2 size={13} color={colors.destructive} />}
                    accessibilityLabel={`Remove ${r.name}`}
                    onPress={() => confirmRemove(r)}
                    style={{ alignSelf: 'flex-start' }}
                  />
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
              <LinkButton
                label="Add"
                accessibilityHint="Log a shared expense"
                onPress={() => setExpenseOpen(true)}
              />
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
        onSubmit={async (task) => {
          if (!assigningTo) return false;
          try {
            await addTaskMutation.mutateAsync({ id: assigningTo.id, task });
            return true;
          } catch {
            return false;
          }
        }}
        submitting={addTaskMutation.isPending}
      />

      <InviteRoommateSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <AddExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} names={names} />
    </View>
  );
}
