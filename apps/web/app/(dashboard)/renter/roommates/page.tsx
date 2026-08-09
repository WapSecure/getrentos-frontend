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

interface Roommate {
  id: string;
  name: string;
  email: string;
  phone: string;
  sharePercentage: number;
  status: 'active' | 'pending' | 'inactive';
  joinedDate: string;
  responsibilities: string[];
  rating?: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  category: 'rent' | 'utilities' | 'groceries' | 'other';
}

export default function RoommatesPage() {
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const loadRoommates = () => {
    const mockRoommates: Roommate[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1 234 567 8901',
        sharePercentage: 33.3,
        status: 'active',
        joinedDate: '2024-01-15',
        responsibilities: ['Kitchen cleaning', 'Grocery shopping'],
        rating: 4.8,
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael@example.com',
        phone: '+1 234 567 8902',
        sharePercentage: 33.3,
        status: 'active',
        joinedDate: '2024-01-15',
        responsibilities: ['Bathroom cleaning', 'Trash duty'],
        rating: 4.5,
      },
      {
        id: '3',
        name: 'Emily Davis',
        email: 'emily@example.com',
        phone: '+1 234 567 8903',
        sharePercentage: 33.4,
        status: 'active',
        joinedDate: '2024-02-01',
        responsibilities: ['Living room cleaning'],
        rating: 4.9,
      },
      {
        id: '4',
        name: 'James Wilson',
        email: 'james@example.com',
        phone: '+1 234 567 8904',
        sharePercentage: 0,
        status: 'pending',
        joinedDate: '2024-06-10',
        responsibilities: [],
        rating: undefined,
      },
    ];
    setRoommates(mockRoommates);

    const mockExpenses: Expense[] = [
      {
        id: 'exp_001',
        description: 'Rent - June 2024',
        amount: 600000,
        paidBy: 'Sarah Johnson',
        splitAmong: ['Sarah Johnson', 'Michael Chen', 'Emily Davis'],
        date: '2024-06-01',
        category: 'rent',
      },
      {
        id: 'exp_002',
        description: 'Utilities - May 2024',
        amount: 45000,
        paidBy: 'Michael Chen',
        splitAmong: ['Sarah Johnson', 'Michael Chen', 'Emily Davis'],
        date: '2024-05-25',
        category: 'utilities',
      },
      {
        id: 'exp_003',
        description: 'Grocery Shopping',
        amount: 30000,
        paidBy: 'Emily Davis',
        splitAmong: ['Sarah Johnson', 'Michael Chen', 'Emily Davis'],
        date: '2024-05-20',
        category: 'groceries',
      },
    ];
    setExpenses(mockExpenses);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoommates();
  }, []);

  const handleInvite = (data: { email: string; message: string }) => {
    const newRoommate: Roommate = {
      id: `rm_${Date.now()}`,
      name: data.email.split('@')[0],
      email: data.email,
      phone: '',
      sharePercentage: 0,
      status: 'pending',
      joinedDate: new Date().toISOString(),
      responsibilities: [],
    };
    setRoommates([...roommates, newRoommate]);
  };

  const handleRemoveRoommate = (id: string) => {
    setRoommates(roommates.filter((r) => r.id !== id));
  };

  const handleUpdateShare = (id: string, percentage: number) => {
    setRoommates(roommates.map((r) => (r.id === id ? { ...r, sharePercentage: percentage } : r)));
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses([...expenses, expense]);
  };

  const handleCompleteTask = (roommateId: string, task: string) => {
    setRoommates(
      roommates.map((r) =>
        r.id === roommateId
          ? { ...r, responsibilities: r.responsibilities.filter((res) => res !== task) }
          : r
      )
    );
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
