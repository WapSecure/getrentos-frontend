export type CalendarEventType = 'viewing' | 'payment' | 'maintenance' | 'lease' | 'personal';
export type CalendarEventStatus = 'upcoming' | 'completed' | 'cancelled';
export type CalendarRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type CalendarViewMode = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  location?: string;
  notes?: string;
  reminder?: boolean;
  recurrence?: CalendarRecurrence;
  color?: string;
}

export type CalendarEventFormData = Omit<CalendarEvent, 'id' | 'status'>;
