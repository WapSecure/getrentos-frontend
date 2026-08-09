'use client';

import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameDay } from 'date-fns';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarWeekViewProps {
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

export const CalendarWeekView = ({ events, currentDate, onEventClick }: CalendarWeekViewProps) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    const top = (((startHour - 8) * 60 + startMinute) / 60) * 48;
    const height = (((endHour - startHour) * 60 + (endMinute - startMinute)) / 60) * 48;
    return { top, height };
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-2 text-center text-xs font-medium text-muted-foreground w-16" />
            {days.map((day, index) => (
              <div
                key={index}
                className={`p-2 text-center ${
                  isToday(day) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    isToday(day) ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800"
              >
                <div className="p-1 text-right text-xs text-gray-400 pr-2 w-16">{hour}:00</div>
                {days.map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day);
                  const dayEventsAtHour = dayEvents.filter((event) => {
                    const eventHour = parseInt(event.startTime.split(':')[0]);
                    return eventHour === hour;
                  });

                  return (
                    <div
                      key={dayIndex}
                      className="h-12 relative border-l border-gray-100 dark:border-gray-800"
                    >
                      {dayEventsAtHour.map((event) => {
                        const position = getEventPosition(event);
                        return (
                          <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="absolute left-0 right-0 mx-0.5 rounded px-1 py-0.5 text-[10px] text-white cursor-pointer hover:opacity-80"
                            style={{
                              top: position.top,
                              height: position.height,
                              backgroundColor:
                                event.color || typeColors[event.type] || 'var(--primary)',
                              minHeight: '16px',
                            }}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
