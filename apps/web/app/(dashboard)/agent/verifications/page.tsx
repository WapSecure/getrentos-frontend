'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, UserCheck } from 'lucide-react';
import { AgentNavbar } from '@/components/agent/navigation/AgentNavbar';
import { AgentSidebar } from '@/components/agent/dashboard/AgentSidebar';
import { VerificationCard } from '@/components/agent/verifications/VerificationCard';
import { NewVerificationModal } from '@/components/agent/verifications/NewVerificationModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get('task') || undefined;

  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visits, setVisits] = useState<VerificationVisit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(!!defaultTaskId);

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
      setVisits(mockVisits);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = (data: Omit<VerificationVisit, 'id' | 'syncStatus'>) => {
    const newVisit: VerificationVisit = {
      ...data,
      id: `ver_${Date.now()}`,
      syncStatus: 'pending',
    };
    setVisits((prev) => [newVisit, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AgentNavbar user={user} />

      <div className="flex">
        <AgentSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Verification Visits
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {visits.length} visit{visits.length === 1 ? '' : 's'} recorded
                </p>
              </div>
              <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Log Verification
              </Button>
            </div>

            {visits.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No verification visits yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
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
          </div>
        </main>
      </div>

      <NewVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasks={mockTasks}
        defaultTaskId={defaultTaskId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function AgentVerificationsPage() {
  return (
    <Suspense fallback={null}>
      <AgentVerificationsPageContent />
    </Suspense>
  );
}
