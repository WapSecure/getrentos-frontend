'use client';

import { useState, useEffect } from 'react';
import { CalendarHeader } from '@/components/renter/calendar/CalendarHeader';
import { CalendarView } from '@/components/renter/calendar/CalendarView';
import { CalendarStats } from '@/components/renter/calendar/CalendarStats';
import { CalendarEventList } from '@/components/renter/calendar/CalendarEventList';
import { CalendarEventModal } from '@/components/renter/calendar/CalendarEventModal';
import { CalendarSync } from '@/components/renter/calendar/CalendarSync';
import type { CalendarEvent, CalendarEventFormData, CalendarViewMode } from '@/types/calendar';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const loadEvents = () => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Property Viewing - Modern Downtown Loft',
        description: 'Walkthrough of the 2-bedroom apartment',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        startTime: '14:00',
        endTime: '15:00',
        type: 'viewing',
        status: 'upcoming',
        location: '420 Main St, Ikeja, Lagos',
        notes: 'Bring ID and proof of income',
        reminder: true,
        color: '#3b82f6',
      },
      {
        id: '2',
        title: 'Rent Payment Due',
        description: 'Monthly rent payment',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        startTime: '09:00',
        endTime: '09:00',
        type: 'payment',
        status: 'upcoming',
        reminder: true,
        color: '#10b981',
      },
      {
        id: '3',
        title: 'Maintenance: AC Service',
        description: 'Routine AC maintenance',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        startTime: '10:00',
        endTime: '12:00',
        type: 'maintenance',
        status: 'upcoming',
        location: 'Modern Downtown Loft',
        reminder: true,
        color: '#f59e0b',
      },
      {
        id: '4',
        title: 'Lease Renewal Meeting',
        description: 'Discuss lease renewal terms',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
        startTime: '15:30',
        endTime: '16:30',
        type: 'lease',
        status: 'upcoming',
        location: 'Virtual Meeting',
        reminder: true,
        color: '#8b5cf6',
      },
      {
        id: '5',
        title: 'Move-in Inspection',
        description: 'Final move-in inspection',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        startTime: '09:00',
        endTime: '11:00',
        type: 'viewing',
        status: 'completed',
        location: 'Modern Downtown Loft',
        reminder: false,
        color: '#6b7280',
      },
    ];
    setEvents(mockEvents);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEvents();
  }, []);

  const handleUpdateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, ...updates } : event)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
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

  const handleSaveEvent = (formData: CalendarEventFormData) => {
    if (editingEvent) {
      handleUpdateEvent(editingEvent.id, formData);
    } else {
      const newEvent: CalendarEvent = {
        id: `event_${Date.now()}`,
        status: 'upcoming',
        ...formData,
      };
      setEvents((prev) => [...prev, newEvent]);
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
