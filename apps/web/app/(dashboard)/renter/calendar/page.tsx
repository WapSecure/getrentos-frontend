'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarHeader } from '@/components/renter/calendar/CalendarHeader';
import { CalendarView } from '@/components/renter/calendar/CalendarView';
import { CalendarStats } from '@/components/renter/calendar/CalendarStats';
import { CalendarEventList } from '@/components/renter/calendar/CalendarEventList';
import { CalendarEventModal } from '@/components/renter/calendar/CalendarEventModal';
import { CalendarSync } from '@/components/renter/calendar/CalendarSync';
import type { CalendarEvent, CalendarEventFormData, CalendarViewMode } from '@/types/calendar';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { PageErrorState, PageLoadingState } from '@getrentos/ui';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const eventsQuery = useQuery({
    queryKey: renterKeys.calendarEvents,
    queryFn: () => unwrap(renterService.listCalendarEvents()),
  });
  const events = eventsQuery.data ?? [];
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const invalidateEvents = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.calendarEvents });

  const createEventMutation = useMutation({
    mutationFn: (data: CalendarEventFormData) => unwrap(renterService.createCalendarEvent(data)),
    onSuccess: invalidateEvents,
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) =>
      unwrap(renterService.updateCalendarEvent(id, updates)),
    onSuccess: invalidateEvents,
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteCalendarEvent(id)),
    onSuccess: invalidateEvents,
  });

  const handleUpdateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    await updateEventMutation.mutateAsync({ id, updates });
  };

  const handleDeleteEvent = (id: string) => deleteEventMutation.mutate(id);

  const openAddEventModal = () => {
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = async (formData: CalendarEventFormData) => {
    if (editingEvent) {
      await handleUpdateEvent(editingEvent.id, formData);
    } else {
      await createEventMutation.mutateAsync(formData);
    }
  };

  if (eventsQuery.isLoading) return <PageLoadingState />;
  if (eventsQuery.isError) {
    return (
      <PageErrorState
        title="Calendar is unavailable"
        description="We could not load your viewings, payments, and personal events."
        onRetry={() => void eventsQuery.refetch()}
        isRetrying={eventsQuery.isFetching}
      />
    );
  }

  return (
    <>
      <CalendarHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAddEvent={openAddEventModal}
      />

      <CalendarStats events={events} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarView
            events={events}
            viewMode={viewMode}
            currentDate={currentDate}
            onEventClick={openEditEventModal}
          />
        </div>
        <div className="space-y-6">
          <CalendarEventList
            events={events}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={openEditEventModal}
          />
          <CalendarSync />
        </div>
      </div>

      <CalendarEventModal
        key={editingEvent?.id ?? 'new-event'}
        isOpen={isEventModalOpen}
        onClose={closeEventModal}
        onSave={handleSaveEvent}
        event={editingEvent}
      />
    </>
  );
}
