'use client';

import { motion } from 'framer-motion';
import { Users, UserPlus } from 'lucide-react';
import { RoommateCard } from './RoommateCard';
import { Button } from '@/components/ui/Button';

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

interface RoommatesListProps {
  roommates: Roommate[];
  onRemove: (id: string) => void;
  onUpdateShare: (id: string, percentage: number) => void;
}

export const RoommatesList = ({ roommates, onRemove, onUpdateShare }: RoommatesListProps) => {
  if (roommates.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 p-12 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No roommates yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Invite your first roommate to start sharing your space
        </p>
        <Button variant="primary" className="mt-4">
          Invite Roommate
        </Button>
      </div>
    );
  }

  const totalPercentage = roommates.reduce((sum, r) => sum + r.sharePercentage, 0);

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Roommates</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {roommates.length} people • {totalPercentage}% rent allocated
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="gap-1">
            <UserPlus className="w-3 h-3" />
            Add
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {roommates.map((roommate, index) => (
          <motion.div
            key={roommate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <RoommateCard roommate={roommate} onRemove={onRemove} onUpdateShare={onUpdateShare} />
          </motion.div>
        ))}
      </div>

      {totalPercentage < 100 && (
        <div className="p-3 border-t border-gray-200 dark:border-white/10 bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            ⚠️ {100 - totalPercentage}% of rent is unallocated. Assign shares to all roommates.
          </p>
        </div>
      )}
    </div>
  );
};
