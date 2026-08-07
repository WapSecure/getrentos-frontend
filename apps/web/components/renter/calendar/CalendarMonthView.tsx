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
  viewing: '#3b82f6',
  payment: '#10b981',
  maintenance: '#f59e0b',
  lease: '#8b5cf6',
  personal: '#c4a747',
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
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/10">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {paddingDays.map((_, index) => (
          <div
            key={`padding-${index}`}
            className="h-24 p-1 border-r border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20"
          />
        ))}

        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toString()}
              className={`h-24 p-1 border-r border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                isTodayDate ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className="flex flex-col h-full">
                <span
                  className={`text-xs font-medium ${
                    isTodayDate ? 'text-[#c4a747]' : 'text-gray-700 dark:text-gray-300'
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
                        backgroundColor: event.color || typeColors[event.type] || '#c4a747',
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-gray-500 px-1">
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
