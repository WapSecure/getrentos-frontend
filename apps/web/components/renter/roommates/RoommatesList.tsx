'use client';

import { motion } from 'framer-motion';
import { Users, UserPlus } from 'lucide-react';
import { RoommateCard } from './RoommateCard';
import { Alert, Button, Card, EmptyState } from '@getrentos/ui';

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
      <EmptyState
        icon={Users}
        title="No roommates yet"
        description="Invite your first roommate to start sharing your space"
        action={<Button variant="primary">Invite Roommate</Button>}
      />
    );
  }

  const totalPercentage = roommates.reduce((sum, r) => sum + r.sharePercentage, 0);

  return (
    <Card>
      <div className="p-4 border-b border-border flex justify-between items-center gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">Roommates</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {roommates.length} people • {totalPercentage}% rent allocated
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" icon={<UserPlus className="w-3 h-3" />}>
            Add
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
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
        <Alert variant="warning" className="rounded-none border-x-0 border-b-0">
          {100 - totalPercentage}% of rent is unallocated. Assign shares to all roommates.
        </Alert>
      )}
    </Card>
  );
};
