'use client';

import { format, isSameDay } from 'date-fns';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarDayViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

const typeColors: Record<string, string> = {
  viewing: '#3b82f6',
  payment: '#10b981',
  maintenance: '#f59e0b',
  lease: '#8b5cf6',
  personal: 'var(--primary)',
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

export const CalendarDayView = ({ events, currentDate, onEventClick }: CalendarDayViewProps) => {
  const dayEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return isSameDay(eventDate, currentDate);
  });

  const getEventPosition = (event: CalendarEvent) => {
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    const top = (((startHour - 8) * 60 + startMinute) / 60) * 48;
    const height = (((endHour - startHour) * 60 + (endMinute - startMinute)) / 60) * 48;
    return { top, height };
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">{format(currentDate, 'EEEE')}</div>
          <div className="text-sm text-muted-foreground">{format(currentDate, 'MMMM d, yyyy')}</div>
          <div className="text-xs text-gray-400 mt-1">{dayEvents.length} events scheduled</div>
        </div>
      </div>

      <div className="relative p-4">
        {HOURS.map((hour) => {
          const eventsAtHour = dayEvents.filter((event) => {
            const eventHour = parseInt(event.startTime.split(':')[0]);
            return eventHour === hour;
          });

          return (
            <div
              key={hour}
              className="flex border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="w-16 py-2 text-right text-xs text-gray-400 pr-2 shrink-0">
                {hour}:00
              </div>
              <div className="flex-1 py-1 relative min-h-[48px] pl-2">
                {eventsAtHour.map((event) => {
                  const position = getEventPosition(event);
                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="absolute left-2 right-2 rounded-lg p-2 text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        top: position.top,
                        height: Math.max(position.height, 40),
                        backgroundColor: event.color || typeColors[event.type] || 'var(--primary)',
                      }}
                    >
                      <div className="text-sm font-medium">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {event.startTime} - {event.endTime}
                      </div>
                      {event.location && (
                        <div className="text-xs opacity-75 mt-0.5">{event.location}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {dayEvents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No events scheduled for this day</p>
          </div>
        )}
      </div>
    </div>
  );
};
