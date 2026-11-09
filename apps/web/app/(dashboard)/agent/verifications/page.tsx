'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, UserCheck } from 'lucide-react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { VerificationCard } from '@/components/agent/verifications/VerificationCard';
import { NewVerificationModal } from '@/components/agent/verifications/NewVerificationModal';
import {
  Alert,
  Button,
  EmptyState,
  ListSkeleton,
  Pagination,
  useToast,
  PageHeader,
} from '@sureground/ui';
import type { VerificationVisit } from '@/types/agent';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';
import { agentOfflineQueue } from '@/lib/agentOfflineQueue';
import { isAgentConnectionFailure, requireAgentQueueOwner } from '@/lib/agentQueueOwner';
import { useAgentUser } from '../layout';

/**
 * A visit stores its subject in lower case; the API spells it in caps. Written
 * out case by case rather than `toUpperCase() as ...` so the compiler checks
 * every member of the union is covered and the result keeps its literal type.
 */
const API_SUBJECT_TYPES: Record<VerificationVisit['subjectType'], 'TENANT' | 'BUYER' | 'PROPERTY'> =
  {
    tenant: 'TENANT',
    buyer: 'BUYER',
    property: 'PROPERTY',
  };

function AgentVerificationsPageContent() {
  const agent = useAgentUser();
  const toast = useToast();
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get('task') || undefined;

  const [isModalOpen, setIsModalOpen] = useState(!!defaultTaskId);
  const queryClient = useQueryClient();
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const {
    data: visitsData,
    error,
    isLoading,
  } = useQuery({
    queryKey: [...agentKeys.verifications, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(agentService.listVerifications({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
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
        agentService.submitVerification(
          {
            taskId: visit.taskId,
            subjectName: visit.subjectName,
            subjectType: API_SUBJECT_TYPES[visit.subjectType],
            idVerified: visit.idVerified,
            addressConfirmed: visit.addressConfirmed,
            notes: visit.notes || undefined,
          },
          requireAgentQueueOwner(agent?.id)
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.verifications });
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks });
      queryClient.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
  });

  const handleSubmit = async (data: Omit<VerificationVisit, 'id' | 'syncStatus'>) => {
    try {
      await submitVerification.mutateAsync(data);
      return true;
    } catch (error) {
      if (!isAgentConnectionFailure(error)) {
        toast.error(
          error instanceof Error ? error.message : 'The verification could not be saved.'
        );
        return false;
      }
      try {
        agentOfflineQueue.enqueue(
          'verification',
          {
            taskId: data.taskId,
            subjectName: data.subjectName,
            subjectType: API_SUBJECT_TYPES[data.subjectType],
            idVerified: data.idVerified,
            addressConfirmed: data.addressConfirmed,
            notes: data.notes || undefined,
          },
          agent?.id
        );
        toast.info(
          'Verification saved on this device. Upload it from the Sync center when connected.'
        );
        return true;
      } catch {
        return false;
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Verification visits"
        description={
          <>
            {total} visit{total === 1 ? '' : 's'} recorded
          </>
        }
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Log verification
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          Unable to save verification changes. Please try again.
        </Alert>
      )}

      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading verification visits" />
      ) : visits.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No verification visits yet"
          description="Log an identity or address verification for one of your assigned tasks."
        />
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
