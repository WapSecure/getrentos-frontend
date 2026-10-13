'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ClipboardList } from 'lucide-react';
import { Button, PageErrorState, PageLoadingState, Pagination } from '@getrentos/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskCard } from '@/components/agent/tasks/TaskCard';
import type { AgentTask, TaskStatus, TaskType } from '@/types/agent';
import { ROUTES } from '@/lib/constants/auth';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';

type StatusFilter = 'all' | TaskStatus;
type TypeFilter = 'all' | TaskType;

export default function AgentTasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const tasksQuery = useQuery({
    queryKey: [
      ...agentKeys.tasks,
      { search: searchQuery, status: statusFilter, type: typeFilter, page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        agentService.listTasks({
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const { data: tasksData } = tasksQuery;
  const tasks = tasksData?.items ?? [];
  const total = tasksData?.total ?? 0;
  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'all' || typeFilter !== 'all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      unwrap(agentService.updateTaskStatus(taskId, status.toUpperCase() as Uppercase<TaskStatus>)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks });
      queryClient.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
  });

  const handleStart = (task: AgentTask) => {
    updateStatus.mutate({ taskId: task.id, status: 'in_progress' });
  };

  const handleComplete = (task: AgentTask) => {
    if (task.type === 'inspection') {
      router.push(`${ROUTES.AGENT_INSPECTIONS}?task=${task.id}`);
    } else if (task.type === 'verification') {
      router.push(`${ROUTES.AGENT_VERIFICATIONS}?task=${task.id}`);
    } else {
      updateStatus.mutate({ taskId: task.id, status: 'completed' });
    }
  };

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
          {total} task{total === 1 ? '' : 's'} assigned to you
        </p>
      </div>

      {updateStatus.error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          Unable to update that task. Please try again.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or property..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <LegacySelect
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as TypeFilter);
            setPage(1);
          }}
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
            type="button"
            aria-pressed={statusFilter === option.value}
            onClick={() => {
              setStatusFilter(option.value);
              setPage(1);
            }}
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

      {tasksQuery.isLoading ? (
        <PageLoadingState />
      ) : tasksQuery.isError ? (
        <PageErrorState
          title="Tasks are unavailable"
          description="We could not load your field assignments. Please try again."
          onRetry={() => void tasksQuery.refetch()}
          isRetrying={tasksQuery.isFetching}
        />
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Clear the current filters to return to all assignments.'
              : 'Tasks assigned to you will appear here.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={() => handleStart(task)}
              onComplete={() => handleComplete(task)}
              onCancel={() => updateStatus.mutate({ taskId: task.id, status: 'cancelled' })}
              isUpdating={updateStatus.isPending && updateStatus.variables?.taskId === task.id}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
