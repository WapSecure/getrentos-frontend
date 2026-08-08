'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ClipboardCheck } from 'lucide-react';
import { AgentNavbar } from '@/components/agent/navigation/AgentNavbar';
import { AgentSidebar } from '@/components/agent/dashboard/AgentSidebar';
import { InspectionCard } from '@/components/agent/inspections/InspectionCard';
import { NewInspectionModal } from '@/components/agent/inspections/NewInspectionModal';
import { InspectionDetailModal } from '@/components/agent/inspections/InspectionDetailModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { PropertyInspection, AgentTask } from '@/types/agent';

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
];

const mockInspections: PropertyInspection[] = [
  {
    id: 'insp_001',
    taskId: 'task_prev_001',
    propertyAddress: 'Ikeja GRA Townhouse',
    clientName: 'Segun Alabi',
    scheduledDate: '2026-08-05T00:00:00.000Z',
    status: 'completed',
    rooms: [
      { room: 'Living Room', condition: 'good', notes: 'Minor scuff on wall', photoCount: 2 },
      { room: 'Kitchen', condition: 'excellent', notes: '', photoCount: 3 },
      { room: 'Master Bedroom', condition: 'good', notes: '', photoCount: 1 },
    ],
    overallCondition: 'good',
    syncStatus: 'synced',
  },
  {
    id: 'insp_002',
    taskId: 'task_prev_002',
    propertyAddress: 'Modern 2-Bed Flat, Ikeja GRA',
    clientName: 'Emeka Chukwu',
    scheduledDate: '2026-08-07T00:00:00.000Z',
    status: 'completed',
    rooms: [
      { room: 'Living Room', condition: 'fair', notes: 'Carpet stain near window', photoCount: 4 },
      { room: 'Bathroom', condition: 'poor', notes: 'Leaking tap needs repair', photoCount: 2 },
    ],
    overallCondition: 'fair',
    syncStatus: 'pending',
  },
];

function AgentInspectionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get('task') || undefined;

  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inspections, setInspections] = useState<PropertyInspection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(!!defaultTaskId);
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);

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
      setInspections(mockInspections);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = (data: Omit<PropertyInspection, 'id' | 'syncStatus'>) => {
    const newInspection: PropertyInspection = {
      ...data,
      id: `insp_${Date.now()}`,
      syncStatus: 'pending',
    };
    setInspections((prev) => [newInspection, ...prev]);
  };

  const handleSync = (inspectionId: string) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === inspectionId ? { ...i, syncStatus: 'synced' } : i))
    );
    setActiveInspectionId(null);
  };

  const activeInspection = inspections.find((i) => i.id === activeInspectionId) || null;

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inspections</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {inspections.length} inspection{inspections.length === 1 ? '' : 's'} recorded
                </p>
              </div>
              <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" />
                New Inspection
              </Button>
            </div>

            {inspections.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <ClipboardCheck className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No inspections yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
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
          </div>
        </main>
      </div>

      <NewInspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasks={mockTasks}
        defaultTaskId={defaultTaskId}
        onSubmit={handleSubmit}
      />

      <InspectionDetailModal
        inspection={activeInspection}
        onClose={() => setActiveInspectionId(null)}
        onSync={handleSync}
      />
    </div>
  );
}

export default function AgentInspectionsPage() {
  return (
    <Suspense fallback={null}>
      <AgentInspectionsPageContent />
    </Suspense>
  );
}
