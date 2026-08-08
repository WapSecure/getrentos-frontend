'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgentNavbar } from '@/components/agent/navigation/AgentNavbar';
import { AgentSidebar } from '@/components/agent/dashboard/AgentSidebar';
import { AgentDashboardHeader } from '@/components/agent/dashboard/AgentDashboardHeader';
import { AgentStatsCards } from '@/components/agent/dashboard/AgentStatsCards';
import { AgentTaskList } from '@/components/agent/dashboard/AgentTaskList';
import { AgentQuickActions } from '@/components/agent/dashboard/AgentQuickActions';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
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
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();

      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (parsedUser.role && parsedUser.role !== 'agent') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AgentNavbar user={user} />

      <div className="flex">
        <AgentSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
          </div>
        </main>
      </div>
    </div>
  );
}
