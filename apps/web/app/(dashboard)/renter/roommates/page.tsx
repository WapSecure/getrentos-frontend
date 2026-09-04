'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RoommatesHeader } from '@/components/renter/roommates/RoommatesHeader';
import { RoommatesStats } from '@/components/renter/roommates/RoommatesStats';
import { RoommatesList } from '@/components/renter/roommates/RoommatesList';
import { RentSplitCalculator } from '@/components/renter/roommates/RentSplitCalculator';
import { ExpenseTracker } from '@/components/renter/roommates/ExpenseTracker';
import { RoommateTasks } from '@/components/renter/roommates/RoommateTasks';
import { InviteRoommateModal } from '@/components/renter/roommates/InviteRoommateModal';
import { RoommateAgreementModal } from '@/components/renter/roommates/RoommateAgreementModal';
import { renterService, type RoommateExpense as Expense } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export default function RoommatesPage() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const { data: roommates = [] } = useQuery({
    queryKey: renterKeys.roommates,
    queryFn: () => unwrap(renterService.listRoommates()),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: renterKeys.roommateExpenses,
    queryFn: () => unwrap(renterService.listRoommateExpenses()),
  });

  const invalidateRoommates = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.roommates });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; message: string }) =>
      unwrap(renterService.inviteRoommate(data.email, data.message)),
    onSuccess: invalidateRoommates,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removeRoommate(id)),
    onSuccess: invalidateRoommates,
  });

  const updateShareMutation = useMutation({
    mutationFn: ({ id, percentage }: { id: string; percentage: number }) =>
      unwrap(renterService.updateRoommateShare(id, percentage)),
    onSuccess: invalidateRoommates,
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
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ roommateId, task }: { roommateId: string; task: string }) =>
      unwrap(renterService.completeRoommateTask(roommateId, task)),
    onSuccess: invalidateRoommates,
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ roommateId, task }: { roommateId: string; task: string }) =>
      unwrap(renterService.addRoommateTask(roommateId, task)),
    onSuccess: invalidateRoommates,
  });

  const handleInvite = (data: { email: string; message: string }) => inviteMutation.mutate(data);
  const handleRemoveRoommate = (id: string) => removeMutation.mutate(id);
  const handleUpdateShare = (id: string, percentage: number) =>
    updateShareMutation.mutate({ id, percentage });
  const handleAddExpense = (expense: Expense) => addExpenseMutation.mutate(expense);
  const handleAddTask = (roommateId: string, task: string) =>
    addTaskMutation.mutateAsync({ roommateId, task }).then(() => undefined);
  const handleCompleteTask = (roommateId: string, task: string) =>
    completeTaskMutation.mutateAsync({ roommateId, task }).then(() => undefined);

  return (
    <>
      <RoommatesHeader
        roommateCount={roommates.length}
        onInvite={() => setShowInviteModal(true)}
        onAgreement={() => setShowAgreementModal(true)}
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

      <RoommateAgreementModal
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        roommates={roommates}
      />
    </>
  );
}
