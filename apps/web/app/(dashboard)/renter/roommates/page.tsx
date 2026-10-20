'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RoommatesHeader } from '@/components/renter/roommates/RoommatesHeader';
import { RoommateInvitesCard } from '@/components/renter/roommates/RoommateInvitesCard';
import { RoommatesStats } from '@/components/renter/roommates/RoommatesStats';
import { RoommatesList } from '@/components/renter/roommates/RoommatesList';
import { RentSplitCalculator } from '@/components/renter/roommates/RentSplitCalculator';
import { ExpenseTracker } from '@/components/renter/roommates/ExpenseTracker';
import { RoommateTasks } from '@/components/renter/roommates/RoommateTasks';
import { InviteRoommateModal } from '@/components/renter/roommates/InviteRoommateModal';
import { renterService, type RoommateExpense as Expense } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { PageErrorState, PageLoadingState, useToast } from '@getrentos/ui';

export default function RoommatesPage() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const toast = useToast();

  const roommatesQuery = useQuery({
    queryKey: renterKeys.roommates,
    queryFn: () => unwrap(renterService.listRoommates()),
  });
  const invitesQuery = useQuery({
    queryKey: renterKeys.roommateInvites,
    queryFn: () => unwrap(renterService.listMyRoommateInvites()),
  });
  const expensesQuery = useQuery({
    queryKey: renterKeys.roommateExpenses,
    queryFn: () => unwrap(renterService.listRoommateExpenses()),
  });
  const roommates = roommatesQuery.data ?? [];
  const invites = invitesQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];

  const invalidateRoommates = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.roommates });
  const invalidateInvites = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.roommateInvites });

  const acceptInviteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.acceptRoommateInvite(id)),
    onSuccess: () => {
      invalidateInvites();
      invalidateRoommates();
    },
    onError: () => toast.error('The invitation could not be accepted.'),
  });

  const declineInviteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.declineRoommateInvite(id)),
    onSuccess: invalidateInvites,
    onError: () => toast.error('The invitation could not be declined.'),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; message: string }) =>
      unwrap(renterService.inviteRoommate(data.email, data.message)),
    onSuccess: invalidateRoommates,
    onError: () => toast.error('The roommate invitation could not be sent.'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removeRoommate(id)),
    onSuccess: invalidateRoommates,
    onError: () => toast.error('The roommate could not be removed.'),
  });

  const updateShareMutation = useMutation({
    mutationFn: ({ id, percentage }: { id: string; percentage: number }) =>
      unwrap(renterService.updateRoommateShare(id, percentage)),
    onSuccess: invalidateRoommates,
    onError: () => toast.error('The rent share could not be updated.'),
  });

  const addExpenseMutation = useMutation({
    mutationFn: (expense: Expense) =>
      unwrap(
        renterService.addRoommateExpense({
          description: expense.description,
          amount: expense.amount,
          paidBy: expense.paidBy,
          splitAmong: expense.splitAmong,
          category: expense.category,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: renterKeys.roommateExpenses }),
    onError: () => toast.error('The shared expense could not be added.'),
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ roommateId, task }: { roommateId: string; task: string }) =>
      unwrap(renterService.completeRoommateTask(roommateId, task)),
    onSuccess: invalidateRoommates,
    onError: () => toast.error('The task could not be completed.'),
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ roommateId, task }: { roommateId: string; task: string }) =>
      unwrap(renterService.addRoommateTask(roommateId, task)),
    onSuccess: invalidateRoommates,
    onError: () => toast.error('The task could not be added.'),
  });

  const handleInvite = (data: { email: string; message: string }) =>
    inviteMutation.mutateAsync(data).then(() => undefined);
  const handleRemoveRoommate = (id: string) => removeMutation.mutate(id);
  const handleUpdateShare = (id: string, percentage: number) =>
    updateShareMutation.mutate({ id, percentage });
  const handleAddExpense = (expense: Expense) =>
    addExpenseMutation.mutateAsync(expense).then(() => undefined);
  const handleAddTask = (roommateId: string, task: string) =>
    addTaskMutation.mutateAsync({ roommateId, task }).then(() => undefined);
  const handleCompleteTask = (roommateId: string, task: string) =>
    completeTaskMutation.mutateAsync({ roommateId, task }).then(() => undefined);
  const handleAcceptInvite = (id: string) => acceptInviteMutation.mutateAsync(id);
  const handleDeclineInvite = (id: string) => declineInviteMutation.mutateAsync(id);

  if (roommatesQuery.isLoading || invitesQuery.isLoading || expensesQuery.isLoading) {
    return <PageLoadingState />;
  }

  if (
    (roommatesQuery.isError && !roommatesQuery.data) ||
    (invitesQuery.isError && !invitesQuery.data) ||
    (expensesQuery.isError && !expensesQuery.data)
  ) {
    const isRetrying =
      roommatesQuery.isFetching || invitesQuery.isFetching || expensesQuery.isFetching;
    return (
      <PageErrorState
        title="Roommate details are unavailable"
        description="We could not load your household tasks and shared expenses. Please try again."
        onRetry={() => {
          void roommatesQuery.refetch();
          void invitesQuery.refetch();
          void expensesQuery.refetch();
        }}
        isRetrying={isRetrying}
      />
    );
  }

  return (
    <>
      <RoommatesHeader roommateCount={roommates.length} onInvite={() => setShowInviteModal(true)} />

      <RoommateInvitesCard
        invites={invites}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />

      <RoommatesStats roommates={roommates} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RoommatesList
            roommates={roommates}
            onRemove={handleRemoveRoommate}
            onUpdateShare={handleUpdateShare}
          />
          <ExpenseTracker
            expenses={expenses}
            roommates={roommates}
            onAddExpense={handleAddExpense}
          />
        </div>
        <div className="space-y-6">
          <RentSplitCalculator roommates={roommates} />
          <RoommateTasks
            roommates={roommates}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
          />
        </div>
      </div>

      <InviteRoommateModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInvite}
      />
    </>
  );
}
