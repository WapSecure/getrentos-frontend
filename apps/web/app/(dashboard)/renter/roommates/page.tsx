'use client';

import { useState, useEffect } from 'react';
import { RoommatesHeader } from '@/components/renter/roommates/RoommatesHeader';
import { RoommatesStats } from '@/components/renter/roommates/RoommatesStats';
import { RoommatesList } from '@/components/renter/roommates/RoommatesList';
import { RentSplitCalculator } from '@/components/renter/roommates/RentSplitCalculator';
import { ExpenseTracker } from '@/components/renter/roommates/ExpenseTracker';
import { RoommateTasks } from '@/components/renter/roommates/RoommateTasks';
import { InviteRoommateModal } from '@/components/renter/roommates/InviteRoommateModal';
import { RoommateAgreementModal } from '@/components/renter/roommates/RoommateAgreementModal';
import {
  renterService,
  type Roommate,
  type RoommateExpense as Expense,
} from '@/services/renterService';

export default function RoommatesPage() {
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    const loadRoommates = async () => {
      const [roommatesRes, expensesRes] = await Promise.all([
        renterService.listRoommates(),
        renterService.listRoommateExpenses(),
      ]);
      if (roommatesRes.success && roommatesRes.data) setRoommates(roommatesRes.data);
      if (expensesRes.success && expensesRes.data) setExpenses(expensesRes.data);
    };
    loadRoommates();
  }, []);

  const handleInvite = async (data: { email: string; message: string }) => {
    const res = await renterService.inviteRoommate(data.email, data.message);
    if (res.success && res.data) {
      const created = res.data;
      setRoommates((prev) => [...prev, created]);
    }
  };

  const handleRemoveRoommate = async (id: string) => {
    const res = await renterService.removeRoommate(id);
    if (res.success) {
      setRoommates((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleUpdateShare = async (id: string, percentage: number) => {
    const res = await renterService.updateRoommateShare(id, percentage);
    if (res.success && res.data) {
      const updated = res.data;
      setRoommates((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  };

  const handleAddExpense = async (expense: Expense) => {
    const res = await renterService.addRoommateExpense({
      description: expense.description,
      amount: expense.amount,
      paidBy: expense.paidBy,
      splitAmong: expense.splitAmong,
      category: expense.category,
    });
    if (res.success && res.data) {
      const created = res.data;
      setExpenses((prev) => [...prev, created]);
    }
  };

  const handleCompleteTask = async (roommateId: string, task: string) => {
    const res = await renterService.completeRoommateTask(roommateId, task);
    if (res.success && res.data) {
      const updated = res.data;
      setRoommates((prev) => prev.map((r) => (r.id === roommateId ? updated : r)));
    }
  };

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
          <RoommateTasks roommates={roommates} onCompleteTask={handleCompleteTask} />
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
