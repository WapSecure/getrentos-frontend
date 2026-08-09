'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, UserCheck } from 'lucide-react';
import { VerificationCard } from '@/components/agent/verifications/VerificationCard';
import { NewVerificationModal } from '@/components/agent/verifications/NewVerificationModal';
import { Button } from '@/components/ui/Button';
import type { VerificationVisit, AgentTask } from '@/types/agent';

const mockTasks: AgentTask[] = [
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
];

const mockVisits: VerificationVisit[] = [
  {
    id: 'ver_001',
    taskId: 'task_prev_003',
    subjectName: 'Ngozi Adeyemi',
    subjectType: 'buyer',
    address: 'Ocean View Towers',
    scheduledDate: '2026-08-06T00:00:00.000Z',
    status: 'completed',
    idVerified: true,
    addressConfirmed: true,
    notes: 'National ID matched, current address confirmed via utility bill.',
    syncStatus: 'synced',
  },
  {
    id: 'ver_002',
    taskId: 'task_prev_004',
    subjectName: 'David Okoro',
    subjectType: 'tenant',
    address: 'Modern 2-Bed Flat, Ikeja GRA',
    scheduledDate: '2026-08-07T00:00:00.000Z',
    status: 'completed',
    idVerified: true,
    addressConfirmed: false,
    notes: 'ID confirmed, address verification pending landlord letter.',
    syncStatus: 'pending',
  },
];

function AgentVerificationsPageContent() {
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get('task') || undefined;

  const [visits, setVisits] = useState<VerificationVisit[]>(mockVisits);
  const [isModalOpen, setIsModalOpen] = useState(!!defaultTaskId);

  const handleSubmit = (data: Omit<VerificationVisit, 'id' | 'syncStatus'>) => {
    const newVisit: VerificationVisit = {
      ...data,
      id: `ver_${Date.now()}`,
      syncStatus: 'pending',
    };
    setVisits((prev) => [newVisit, ...prev]);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification Visits</h1>
          <p className="text-muted-foreground mt-1">
            {visits.length} visit{visits.length === 1 ? '' : 's'} recorded
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Log Verification
        </Button>
      </div>

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

      <NewVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasks={mockTasks}
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
