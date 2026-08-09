'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ClipboardCheck } from 'lucide-react';
import { InspectionCard } from '@/components/agent/inspections/InspectionCard';
import { NewInspectionModal } from '@/components/agent/inspections/NewInspectionModal';
import { InspectionDetailModal } from '@/components/agent/inspections/InspectionDetailModal';
import { Button } from '@/components/ui/Button';
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
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get('task') || undefined;

  const [inspections, setInspections] = useState<PropertyInspection[]>(mockInspections);
  const [isModalOpen, setIsModalOpen] = useState(!!defaultTaskId);
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);

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
        tasks={mockTasks}
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
