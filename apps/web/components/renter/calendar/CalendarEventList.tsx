'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { EmptyState } from '@getrentos/ui';
import { IconButton } from '@getrentos/ui';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarEventListProps {
  events: CalendarEvent[];
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

const typeColors: Record<string, { bg: string; text: string }> = {
  viewing: { bg: 'bg-info-subtle', text: 'text-info' },
  payment: { bg: 'bg-success-subtle', text: 'text-success' },
  maintenance: { bg: 'bg-warning-subtle', text: 'text-warning' },
  lease: { bg: 'bg-purple-subtle', text: 'text-purple' },
  personal: { bg: 'bg-secondary', text: 'text-muted-foreground' },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  upcoming: { label: 'Upcoming', icon: Clock, color: 'text-info' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-success' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-destructive' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
};

export const CalendarEventList = ({
  events,
  onUpdateEvent,
  onDeleteEvent,
  onEditEvent,
}: CalendarEventListProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/12"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Upcoming Events</h3>
            <p className="text-xs text-muted-foreground">{events.length} events</p>
          </div>
        </div>
        <span aria-hidden="true" className="p-1 text-muted-foreground">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isExpanded && (
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {sortedEvents.length === 0 ? (
            <EmptyState icon={Calendar} title="No events scheduled" size="compact" bare />
          ) : (
            sortedEvents.map((event) => {
              const typeStyle = typeColors[event.type] || typeColors.personal;
              const status = statusConfig[event.status] || statusConfig.upcoming;
              const StatusIcon = status.icon;

              return (
                <div key={event.id} className="p-3 hover:bg-secondary transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${typeStyle.bg} ${typeStyle.text}`}
                        >
                          {event.type}
                        </span>
                        <span className={`text-xs flex items-center gap-1 ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-foreground mt-1">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(event.date)} • {event.startTime} - {event.endTime}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconButton
                        label={
                          event.status === 'completed' ? 'Mark as upcoming' : 'Mark as completed'
                        }
                        icon={<CheckCircle />}
                        size="sm"
                        className="text-info hover:text-primary"
                        onClick={() =>
                          onUpdateEvent(event.id, {
                            status: event.status === 'completed' ? 'upcoming' : 'completed',
                          })
                        }
                      />
                      <IconButton
                        label="Edit event"
                        icon={<Edit2 />}
                        size="sm"
                        onClick={() => onEditEvent(event)}
                      />
                      <IconButton
                        label="Delete event"
                        icon={<Trash2 />}
                        size="sm"
                        variant="danger"
                        onClick={() => onDeleteEvent(event.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
