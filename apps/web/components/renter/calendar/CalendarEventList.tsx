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
import { Button } from '@/components/ui/Button';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarEventListProps {
  events: CalendarEvent[];
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

const typeColors: Record<string, { bg: string; text: string }> = {
  viewing: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  payment: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
  maintenance: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  lease: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  personal: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-muted-foreground' },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  upcoming: { label: 'Upcoming', icon: Clock, color: 'text-blue-600' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600' },
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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Upcoming Events</h3>
            <p className="text-xs text-gray-500">{events.length} events</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {sortedEvents.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No events scheduled</div>
          ) : (
            sortedEvents.map((event) => {
              const typeStyle = typeColors[event.type] || typeColors.personal;
              const status = statusConfig[event.status] || statusConfig.upcoming;
              const StatusIcon = status.icon;

              return (
                <div key={event.id} className="p-3 hover:bg-secondary transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}
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
                        <p className="text-xs text-gray-400 mt-0.5">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-blue-500 hover:text-blue-700"
                        title={
                          event.status === 'completed' ? 'Mark as upcoming' : 'Mark as completed'
                        }
                        onClick={() =>
                          onUpdateEvent(event.id, {
                            status: event.status === 'completed' ? 'upcoming' : 'completed',
                          })
                        }
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-gray-500 hover:text-gray-700"
                        title="Edit event"
                        onClick={() => onEditEvent(event)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-red-500 hover:text-red-700"
                        title="Delete event"
                        onClick={() => onDeleteEvent(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
