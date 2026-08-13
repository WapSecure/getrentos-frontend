'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { LegacySelect } from '@/components/ui/LegacySelect';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ClipboardList } from 'lucide-react';
import { TaskCard } from '@/components/agent/tasks/TaskCard';
import type { AgentTask, TaskStatus, TaskType } from '@/types/agent';
import { ROUTES } from '@/lib/constants/auth';

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
  const [tasks, setTasks] = useState<AgentTask[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const updateStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const handleStart = (task: AgentTask) => {
    updateStatus(task.id, 'in_progress');
  };

  const handleComplete = (task: AgentTask) => {
    updateStatus(task.id, 'completed');
    if (task.type === 'inspection') {
      router.push(`${ROUTES.AGENT_INSPECTIONS}?task=${task.id}`);
    } else if (task.type === 'verification') {
      router.push(`${ROUTES.AGENT_VERIFICATIONS}?task=${task.id}`);
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
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <p className="text-muted-foreground mt-1">
          {tasks.length} task{tasks.length === 1 ? '' : 's'} assigned to you
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or property..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <LegacySelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-fit"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </LegacySelect>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
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
    </>
  );
}
