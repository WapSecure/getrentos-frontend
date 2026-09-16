import { apiFetch } from './client';

export const CALENDAR_EVENT_TYPES = [
  'viewing',
  'payment',
  'maintenance',
  'lease',
  'personal',
] as const;
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export const CALENDAR_EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  viewing: 'Viewing',
  payment: 'Payment',
  maintenance: 'Maintenance',
  lease: 'Lease',
  personal: 'Personal',
};

export const CALENDAR_EVENT_TYPE_COLOR: Record<
  CalendarEventType,
  'info' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  viewing: 'info',
  payment: 'warning',
  maintenance: 'danger',
  lease: 'success',
  personal: 'neutral',
};

export type CalendarEventStatus = 'upcoming' | 'completed' | 'cancelled';
export const CALENDAR_RECURRENCES = ['none', 'daily', 'weekly', 'monthly'] as const;
export type CalendarRecurrence = (typeof CALENDAR_RECURRENCES)[number];

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

export interface UpsertCalendarEventInput {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: CalendarEventType;
  status?: CalendarEventStatus;
  location?: string;
  notes?: string;
  reminder?: boolean;
  recurrence?: CalendarRecurrence;
}

export const calendarApi = {
  list: () => apiFetch<CalendarEvent[]>('/renter/calendar-events'),

  create: (input: UpsertCalendarEventInput) =>
    apiFetch<CalendarEvent>('/renter/calendar-events', { method: 'POST', body: input }),

  update: (id: string, input: Partial<UpsertCalendarEventInput>) =>
    apiFetch<CalendarEvent>(`/renter/calendar-events/${id}`, { method: 'PATCH', body: input }),

  remove: (id: string) => apiFetch<void>(`/renter/calendar-events/${id}`, { method: 'DELETE' }),
};
