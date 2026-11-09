'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ClipboardCheck } from '@sureground/icons';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InspectionCard } from '@/components/agent/inspections/InspectionCard';
import { NewInspectionModal } from '@/components/agent/inspections/NewInspectionModal';
import { InspectionDetailModal } from '@/components/agent/inspections/InspectionDetailModal';
import {
  Alert,
  Button,
  EmptyState,
  ListSkeleton,
  Pagination,
  useToast,
  PageHeader,
} from '@sureground/ui';
import type { PropertyInspection } from '@/types/agent';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';
import { agentOfflineQueue } from '@/lib/agentOfflineQueue';
import { isAgentConnectionFailure, requireAgentQueueOwner } from '@/lib/agentQueueOwner';
import { useAgentUser } from '../layout';

function AgentInspectionsPageContent() {
  const agent = useAgentUser();
  const toast = useToast();
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get('task') || undefined;

  const [isModalOpen, setIsModalOpen] = useState(!!defaultTaskId);
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const {
    data: inspectionsData,
    error,
    isLoading,
  } = useQuery({
    queryKey: [...agentKeys.inspections, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(agentService.listInspections({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const inspections = inspectionsData?.items ?? [];
  const total = inspectionsData?.total ?? 0;
  const { data: tasksData } = useQuery({
    queryKey: [...agentKeys.tasks, { type: 'inspection', page: 1, pageSize: 100 }],
    queryFn: () => unwrap(agentService.listTasks({ type: 'inspection', page: 1, pageSize: 100 })),
  });
  const tasks = tasksData?.items ?? [];
  const submitInspection = useMutation({
    mutationFn: (inspection: Omit<PropertyInspection, 'id' | 'syncStatus' | 'acknowledgedAt'>) =>
      unwrap(
        agentService.submitInspection(
          {
            taskId: inspection.taskId,
            scheduledAt: inspection.scheduledDate,
            type: inspection.type.toUpperCase() as 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER',
            rooms: inspection.rooms,
            clientName: inspection.clientName,
            overallCondition: inspection.overallCondition,
          },
          requireAgentQueueOwner(agent?.id)
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.inspections });
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks });
      queryClient.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
  });

  const handleSubmit = async (
    data: Omit<PropertyInspection, 'id' | 'syncStatus' | 'acknowledgedAt'>
  ) => {
    try {
      await submitInspection.mutateAsync(data);
      return true;
    } catch (error) {
      if (!isAgentConnectionFailure(error)) {
        toast.error(error instanceof Error ? error.message : 'The inspection could not be saved.');
        return false;
      }
      try {
        agentOfflineQueue.enqueue(
          'inspection',
          {
            taskId: data.taskId,
            scheduledAt: data.scheduledDate,
            type: data.type.toUpperCase() as 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER',
            rooms: data.rooms,
            clientName: data.clientName,
            overallCondition: data.overallCondition,
          },
          agent?.id
        );
        toast.info(
          'Inspection saved on this device. Upload it from the Sync Center when connected.'
        );
        return true;
      } catch {
        return false;
      }
    }
  };

  const activeInspection = inspections.find((i) => i.id === activeInspectionId) || null;

  return (
    <>
      <PageHeader
        title="Inspections"
        description={
          <>
            {total} inspection{total === 1 ? '' : 's'} recorded
          </>
        }
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            New inspection
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          Unable to save inspection changes. Please try again.
        </Alert>
      )}

      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading inspections" />
      ) : inspections.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No inspections yet"
          description="Record a room-by-room inspection for one of your assigned tasks."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {inspections.map((inspection, index) => (
            <InspectionCard
              key={inspection.id}
              inspection={inspection}
              delay={index * 0.05}
              onClick={() => setActiveInspectionId(inspection.id)}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            setActiveInspectionId(null);
          }}
          className="mt-6"
        />
      )}

      <NewInspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasks={tasks.filter((task) => task.type === 'inspection' && task.status !== 'completed')}
        defaultTaskId={defaultTaskId}
        onSubmit={handleSubmit}
      />

      <InspectionDetailModal
        inspection={activeInspection}
        onClose={() => setActiveInspectionId(null)}
      />
    </>
  );
}

export default function AgentInspectionsPage() {
  return (
    <Suspense fallback={null}>
      <AgentInspectionsPageContent />
    </Suspense>
  );
}
