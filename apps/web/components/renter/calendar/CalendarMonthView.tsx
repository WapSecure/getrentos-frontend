'use client';

import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { motion } from 'framer-motion';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarMonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

const typeColors: Record<string, string> = {
  viewing: 'var(--info)',
  payment: 'var(--success)',
  maintenance: 'var(--warning)',
  lease: 'var(--purple)',
  personal: 'var(--primary)',
};

export const CalendarMonthView = ({
  events,
  currentDate,
  onEventClick,
}: CalendarMonthViewProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {paddingDays.map((_, index) => (
          <div
            key={`padding-${index}`}
            className="h-24 p-1 border-r border-b border-border bg-muted"
          />
        ))}

        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toString()}
              className={`h-24 p-1 border-r border-b border-border hover:bg-secondary transition-colors cursor-pointer ${
                isTodayDate ? 'bg-accent/70' : ''
              }`}
            >
              <div className="flex flex-col h-full">
                <span
                  className={`text-xs font-medium ${
                    isTodayDate ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                <div className="flex-1 overflow-y-auto space-y-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className="text-[10px] px-1 py-0.5 rounded truncate text-white"
                      style={{
                        backgroundColor: event.color || typeColors[event.type] || 'var(--primary)',
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
