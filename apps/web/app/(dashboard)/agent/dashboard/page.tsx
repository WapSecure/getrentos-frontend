'use client';

import { useAgentUser } from '../layout';
import { AgentDashboardHeader } from '@/components/agent/dashboard/AgentDashboardHeader';
import { AgentStatsCards } from '@/components/agent/dashboard/AgentStatsCards';
import { AgentTaskList } from '@/components/agent/dashboard/AgentTaskList';
import { AgentQuickActions } from '@/components/agent/dashboard/AgentQuickActions';
import type { AgentTask } from '@/types/agent';

const mockStats = {
  todaysTasks: 3,
  completedThisWeek: 8,
  pendingSync: 2,
  overdueTasks: 1,
  avgRating: 4.7,
  avgResponseTime: '< 1 hr',
};

const mockTodaysTasks: AgentTask[] = [
  {
    id: 'task_001',
    type: 'inspection',
    title: 'Move-out Inspection',
    propertyAddress: 'Ocean View Towers, Unit 4B',
    assignedBy: 'GetRentos Admin',
    assignedByRole: 'admin',
    priority: 'high',
    status: 'assigned',
    dueDate: '2026-08-08T14:00:00.000Z',
  },
  {
    id: 'task_002',
    type: 'verification',
    title: 'Tenant Identity Verification',
    propertyAddress: 'Palm Court Villa, Unit 2',
    assignedBy: 'Adaeze Okafor',
    assignedByRole: 'landlord',
    priority: 'medium',
    status: 'assigned',
    dueDate: '2026-08-08T16:30:00.000Z',
  },
  {
    id: 'task_003',
    type: 'valuation',
    title: 'Property Valuation Visit',
    propertyAddress: 'Ikeja GRA Townhouse',
    assignedBy: 'Segun Alabi',
    assignedByRole: 'owner',
    priority: 'low',
    status: 'overdue',
    dueDate: '2026-08-07T12:00:00.000Z',
  },
];

export default function AgentDashboardPage() {
  const user = useAgentUser();

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <>
      <AgentDashboardHeader greeting={greeting} firstName={firstName} />

      <AgentStatsCards {...mockStats} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AgentTaskList tasks={mockTodaysTasks} />
        </div>
        <div>
          <AgentQuickActions />
        </div>
      </div>
    </>
  );
}
