'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, UserCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { VerificationCard } from '@/components/agent/verifications/VerificationCard';
import { NewVerificationModal } from '@/components/agent/verifications/NewVerificationModal';
import { Button, Pagination } from '@getrentos/ui';
import type { VerificationVisit } from '@/types/agent';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';
import { agentOfflineQueue } from '@/lib/agentOfflineQueue';

function AgentVerificationsPageContent() {
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get('task') || undefined;

  const [isModalOpen, setIsModalOpen] = useState(!!defaultTaskId);
  const queryClient = useQueryClient();
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const { data: visitsData, error } = useQuery({
    queryKey: [...agentKeys.verifications, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(agentService.listVerifications({ page, pageSize: PAGE_SIZE })),
  });
  const visits = visitsData?.items ?? [];
  const total = visitsData?.total ?? 0;
  const { data: tasksData } = useQuery({
    queryKey: [...agentKeys.tasks, { type: 'verification', page: 1, pageSize: 100 }],
    queryFn: () => unwrap(agentService.listTasks({ type: 'verification', page: 1, pageSize: 100 })),
  });
  const tasks = tasksData?.items ?? [];
  const submitVerification = useMutation({
    mutationFn: (visit: Omit<VerificationVisit, 'id' | 'syncStatus'>) =>
      unwrap(
        agentService.submitVerification({
          taskId: visit.taskId,
          subjectName: visit.subjectName,
          subjectType: visit.subjectType.toUpperCase() as 'TENANT' | 'BUYER' | 'PROPERTY',
          idVerified: visit.idVerified,
          addressConfirmed: visit.addressConfirmed,
          notes: visit.notes || undefined,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.verifications });
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks });
      queryClient.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
    onError: (_error, visit) =>
      agentOfflineQueue.enqueue('verification', {
        taskId: visit.taskId,
        subjectName: visit.subjectName,
        subjectType: visit.subjectType.toUpperCase(),
        idVerified: visit.idVerified,
        addressConfirmed: visit.addressConfirmed,
        notes: visit.notes || undefined,
      }),
  });

  const handleSubmit = (data: Omit<VerificationVisit, 'id' | 'syncStatus'>) => {
    submitVerification.mutate(data);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification Visits</h1>
          <p className="text-muted-foreground mt-1">
            {total} visit{total === 1 ? '' : 's'} recorded
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Log Verification
        </Button>
      </div>

      {(error || submitVerification.error) && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          Unable to save verification changes. Please try again.
        </p>
      )}

      {visits.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No verification visits yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Log an identity or address verification for one of your assigned tasks.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visits.map((visit, index) => (
            <VerificationCard key={visit.id} visit={visit} delay={index * 0.05} />
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

      <NewVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasks={tasks.filter((task) => task.type === 'verification' && task.status !== 'completed')}
        defaultTaskId={defaultTaskId}
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default function AgentVerificationsPage() {
  return (
    <Suspense fallback={null}>
      <AgentVerificationsPageContent />
    </Suspense>
  );
}
