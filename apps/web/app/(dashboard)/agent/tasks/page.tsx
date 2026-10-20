'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import {
  Alert,
  Button,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@getrentos/ui';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    placeholderData: keepPreviousData,
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
        <Alert variant="danger" className="mb-4">
          Unable to update that task. Please try again.
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by title or property..."
          label="Search tasks"
          className="flex-1 max-w-sm"
        />
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as TypeFilter);
            setPage(1);
          }}
          ariaLabel="Filter by task type"
          options={typeOptions}
          className="sm:w-48"
        />
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(value) => {
          setStatusFilter(value as StatusFilter);
          setPage(1);
        }}
        className="mb-6"
      >
        <TabsList className="max-w-full">
          {statusOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tasksQuery.isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading tasks" />
      ) : tasksQuery.isError && !tasksData ? (
        <PageErrorState
          title="Tasks are unavailable"
          description="We could not load your field assignments. Please try again."
          onRetry={() => void tasksQuery.refetch()}
          isRetrying={tasksQuery.isFetching}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          description={
            hasActiveFilters
              ? 'Clear the current filters to return to all assignments.'
              : 'Tasks assigned to you will appear here.'
          }
          action={
            hasActiveFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
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
