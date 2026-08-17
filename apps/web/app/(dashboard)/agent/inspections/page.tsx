'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ClipboardCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InspectionCard } from '@/components/agent/inspections/InspectionCard';
import { NewInspectionModal } from '@/components/agent/inspections/NewInspectionModal';
import { InspectionDetailModal } from '@/components/agent/inspections/InspectionDetailModal';
import { Button } from '@getrentos/ui';
import type { PropertyInspection } from '@/types/agent';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';
import { agentOfflineQueue } from '@/lib/agentOfflineQueue';

function AgentInspectionsPageContent() {
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get('task') || undefined;

  const [isModalOpen, setIsModalOpen] = useState(!!defaultTaskId);
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: inspections = [], error } = useQuery({
    queryKey: agentKeys.inspections,
    queryFn: () => unwrap(agentService.listInspections()),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: agentKeys.tasks,
    queryFn: () => unwrap(agentService.listTasks()),
  });
  const submitInspection = useMutation({
    mutationFn: (inspection: Omit<PropertyInspection, 'id' | 'syncStatus' | 'acknowledgedAt'>) =>
      unwrap(
        agentService.submitInspection({
          taskId: inspection.taskId,
          scheduledAt: inspection.scheduledDate,
          type: inspection.type.toUpperCase() as 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER',
          rooms: inspection.rooms,
          clientName: inspection.clientName,
          overallCondition: inspection.overallCondition,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.inspections });
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks });
      queryClient.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
    onError: (_error, inspection) =>
      agentOfflineQueue.enqueue('inspection', {
        taskId: inspection.taskId,
        scheduledAt: inspection.scheduledDate,
        type: inspection.type.toUpperCase() as 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER',
        rooms: inspection.rooms,
        clientName: inspection.clientName,
        overallCondition: inspection.overallCondition,
      }),
  });

  const handleSubmit = (data: Omit<PropertyInspection, 'id' | 'syncStatus' | 'acknowledgedAt'>) => {
    submitInspection.mutate(data);
  };

  const handleSync = (inspectionId: string) => {
    setActiveInspectionId(null);
  };

  const activeInspection = inspections.find((i) => i.id === activeInspectionId) || null;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inspections</h1>
          <p className="text-muted-foreground mt-1">
            {inspections.length} inspection{inspections.length === 1 ? '' : 's'} recorded
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          New Inspection
        </Button>
      </div>

      {(error || submitInspection.error) && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          Unable to save inspection changes. Please try again.
        </p>
      )}

      {inspections.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <ClipboardCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No inspections yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Record a room-by-room inspection for one of your assigned tasks.
          </p>
        </div>
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
        onSync={handleSync}
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
