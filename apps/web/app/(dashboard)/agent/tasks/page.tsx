'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ClipboardList } from 'lucide-react';
import { AgentNavbar } from '@/components/agent/navigation/AgentNavbar';
import { AgentSidebar } from '@/components/agent/dashboard/AgentSidebar';
import { TaskCard } from '@/components/agent/tasks/TaskCard';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { AgentTask, TaskStatus, TaskType } from '@/types/agent';

const mockTasks: AgentTask[] = [
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
  {
    id: 'task_004',
    type: 'inspection',
    title: 'Move-in Inspection',
    propertyAddress: 'Surulere Family Duplex',
    assignedBy: 'GetRentos Admin',
    assignedByRole: 'admin',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2026-08-08T10:00:00.000Z',
  },
  {
    id: 'task_005',
    type: 'document_pickup',
    title: 'Pick up signed lease',
    propertyAddress: 'Modern 2-Bed Flat, Ikeja GRA',
    assignedBy: 'Emeka Chukwu',
    assignedByRole: 'landlord',
    priority: 'low',
    status: 'completed',
    dueDate: '2026-08-05T00:00:00.000Z',
  },
];

type StatusFilter = 'all' | TaskStatus;
type TypeFilter = 'all' | TaskType;

export default function AgentTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

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
      setTasks(mockTasks);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const updateStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const handleStart = (task: AgentTask) => {
    updateStatus(task.id, 'in_progress');
  };

  const handleComplete = (task: AgentTask) => {
    updateStatus(task.id, 'completed');
    if (task.type === 'inspection') {
      router.push(`/agent/inspections?task=${task.id}`);
    } else if (task.type === 'verification') {
      router.push(`/agent/verifications?task=${task.id}`);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'verification', label: 'Verification' },
    { value: 'valuation', label: 'Valuation' },
    { value: 'document_pickup', label: 'Document Pickup' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AgentNavbar user={user} />

      <div className="flex">
        <AgentSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {tasks.length} task{tasks.length === 1 ? '' : 's'} assigned to you
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or property..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c4a747] w-fit"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit overflow-x-auto mb-6">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === option.value
                      ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {tasks.length === 0
                    ? 'Tasks assigned to you will appear here.'
                    : 'Try adjusting your search or filter.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    delay={index * 0.05}
                    onStart={() => handleStart(task)}
                    onComplete={() => handleComplete(task)}
                    onCancel={() => updateStatus(task.id, 'cancelled')}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
