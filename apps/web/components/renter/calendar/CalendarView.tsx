'use client';

import { useState } from 'react';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import type { CalendarEvent, CalendarViewMode } from '@/types/calendar';

interface CalendarViewProps {
  events: CalendarEvent[];
  viewMode: CalendarViewMode;
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarView = ({
  events,
  viewMode,
  currentDate,
  onEventClick,
}: CalendarViewProps) => {
  switch (viewMode) {
    case 'month':
      return (
        <CalendarMonthView events={events} currentDate={currentDate} onEventClick={onEventClick} />
      );
    case 'week':
      return (
        <CalendarWeekView events={events} currentDate={currentDate} onEventClick={onEventClick} />
      );
    case 'day':
      return (
        <CalendarDayView events={events} currentDate={currentDate} onEventClick={onEventClick} />
      );
    default:
      return (
        <CalendarMonthView events={events} currentDate={currentDate} onEventClick={onEventClick} />
      );
  }
};
