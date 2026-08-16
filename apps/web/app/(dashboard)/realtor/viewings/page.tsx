'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarClock } from 'lucide-react';
import { ViewingCard } from '@/components/realtor/viewings/ViewingCard';
import { ScheduleViewingModal } from '@/components/realtor/viewings/ScheduleViewingModal';
import type { CreateViewingInput } from '@/components/realtor/viewings/ScheduleViewingModal';
import { Button } from '@getrentos/ui';
import type { ViewingAppointment } from '@/types/realtor';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorLead, mapRealtorViewing, realtorService } from '@/services/realtorService';

function RealtorViewingsPageContent() {
  const searchParams = useSearchParams();
  const defaultLeadId = searchParams.get('lead') || undefined;

  const [isModalOpen, setIsModalOpen] = useState(!!defaultLeadId);
  const queryClient = useQueryClient();
  const { data: viewings = [], isLoading } = useQuery({
    queryKey: realtorKeys.viewings,
    queryFn: async () => (await unwrap(realtorService.listViewings())).map(mapRealtorViewing),
  });
  const { data: leads = [] } = useQuery({
    queryKey: realtorKeys.leads,
    queryFn: async () => (await unwrap(realtorService.listLeads())).map(mapRealtorLead),
  });
  const createViewing = useMutation({
    mutationFn: (appointment: Omit<ViewingAppointment, 'id' | 'status'> & { leadId: string }) =>
      unwrap(
        realtorService.createViewing({
          listingId: appointment.listingId,
          leadId: appointment.leadId,
          scheduledAt: `${appointment.scheduledDate}T${appointment.scheduledTime}:00.000Z`,
          notes: appointment.notes,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.viewings });
      setIsModalOpen(false);
    },
  });
  const updateViewing = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }) =>
      unwrap(realtorService.updateViewingStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.viewings }),
  });

  const handleSubmit = (appointment: CreateViewingInput) => {
    createViewing.mutate(appointment);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Viewings</h1>
          <p className="text-muted-foreground mt-1">
            {viewings.length} scheduled tour{viewings.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Schedule Viewing
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
          Loading viewings…
        </div>
      ) : viewings.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <CalendarClock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No viewings scheduled</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Schedule a tour with one of your leads to get started.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {viewings.map((viewing, index) => (
            <ViewingCard
              key={viewing.id}
              viewing={viewing}
              delay={index * 0.05}
              onConfirm={() => updateViewing.mutate({ id: viewing.id, status: 'CONFIRMED' })}
              onComplete={() => updateViewing.mutate({ id: viewing.id, status: 'COMPLETED' })}
              onCancel={() => updateViewing.mutate({ id: viewing.id, status: 'CANCELLED' })}
            />
          ))}
        </div>
      )}

      <ScheduleViewingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leads={leads}
        defaultLeadId={defaultLeadId}
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default function RealtorViewingsPage() {
  return (
    <Suspense fallback={null}>
      <RealtorViewingsPageContent />
    </Suspense>
  );
}
