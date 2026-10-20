'use client';

import { Users, UserCheck, UserX, UserPlus } from 'lucide-react';
import { StatCard } from '@getrentos/ui';

interface Roommate {
  id: string;
  status: 'active' | 'pending' | 'inactive';
}

interface RoommatesStatsProps {
  roommates: Roommate[];
}

export const RoommatesStats = ({ roommates }: RoommatesStatsProps) => {
  const total = roommates.length;
  const active = roommates.filter((r) => r.status === 'active').length;
  const pending = roommates.filter((r) => r.status === 'pending').length;
  const inactive = roommates.filter((r) => r.status === 'inactive').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard icon={Users} label="Total Roommates" value={total} accent="primary" />
      <StatCard icon={UserCheck} label="Active" value={active} accent="green" />
      <StatCard icon={UserPlus} label="Pending" value={pending} accent="orange" />
      <StatCard icon={UserX} label="Inactive" value={inactive} accent="red" />
    </div>
  );
};
