'use client';

import { useState, useEffect } from 'react';
import { CalendarHeader } from '@/components/renter/calendar/CalendarHeader';
import { CalendarView } from '@/components/renter/calendar/CalendarView';
import { CalendarStats } from '@/components/renter/calendar/CalendarStats';
import { CalendarEventList } from '@/components/renter/calendar/CalendarEventList';
import { CalendarEventModal } from '@/components/renter/calendar/CalendarEventModal';
import { CalendarSync } from '@/components/renter/calendar/CalendarSync';
import type { CalendarEvent, CalendarEventFormData, CalendarViewMode } from '@/types/calendar';
import { renterService } from '@/services/renterService';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      const res = await renterService.listCalendarEvents();
      if (res.success && res.data) setEvents(res.data);
    };
    loadEvents();
  }, []);

  const handleUpdateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const res = await renterService.updateCalendarEvent(id, updates);
    if (res.success && res.data) {
      const updated = res.data;
      setEvents((prev) => prev.map((event) => (event.id === id ? updated : event)));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const res = await renterService.deleteCalendarEvent(id);
    if (res.success) {
      setEvents((prev) => prev.filter((event) => event.id !== id));
    }
  };

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
      const res = await renterService.createCalendarEvent(formData);
      if (res.success && res.data) {
        const created = res.data;
        setEvents((prev) => [...prev, created]);
      }
    }
  };

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
