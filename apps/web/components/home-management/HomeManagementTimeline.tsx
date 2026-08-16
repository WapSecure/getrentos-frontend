'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Boxes,
  CalendarClock,
  CircleAlert,
  ClipboardCheck,
  FileText,
  MapPin,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type HomeManagementTimelineEvent,
} from '@/services/homeManagementService';

const DEFAULT_TIMELINE_LIMIT = 8;
const MAX_TIMELINE_LIMIT = 20;

type TimelineEventMeta = {
  icon: LucideIcon;
  iconClassName: string;
};

const defaultEventMeta: TimelineEventMeta = {
  icon: Activity,
  iconClassName: 'bg-secondary text-muted-foreground',
};

const getEventMeta = (type: string): TimelineEventMeta => {
  const normalizedType = type.toUpperCase();

  if (
    normalizedType.includes('WORK_ORDER') ||
    normalizedType.includes('MAINTENANCE') ||
    normalizedType.includes('SERVICE') ||
    normalizedType.includes('VENDOR')
  ) {
    return { icon: Wrench, iconClassName: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' };
  }

  if (
    normalizedType.includes('PLAN') ||
    normalizedType.includes('SCHEDULE') ||
    normalizedType.includes('CARE')
  ) {
    return { icon: CalendarClock, iconClassName: 'bg-primary/10 text-primary' };
  }

  if (normalizedType.includes('INSPECTION') || normalizedType.includes('FIELD')) {
    return {
      icon: ClipboardCheck,
      iconClassName: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    };
  }

  if (normalizedType.includes('ASSET') || normalizedType.includes('WARRANTY')) {
    return { icon: Boxes, iconClassName: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' };
  }

  if (normalizedType.includes('DOCUMENT') || normalizedType.includes('RECORD')) {
    return { icon: FileText, iconClassName: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' };
  }

  return defaultEventMeta;
};

const toLabel = (value: string) => {
  const words = value
    .toLowerCase()
    .split('_')
    .join(' ')
    .split('-')
    .join(' ')
    .split(' ')
    .filter(Boolean);

  return words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
};

const statusVariant = (status: string): BadgeVariant => {
  const normalizedStatus = status.toUpperCase();

  if (
    normalizedStatus.includes('APPROVED') ||
    normalizedStatus.includes('COMPLETED') ||
    normalizedStatus.includes('RESOLVED') ||
    normalizedStatus.includes('ACTIVE') ||
    normalizedStatus.includes('SUBMITTED')
  ) {
    return 'success';
  }

  if (
    normalizedStatus.includes('REJECTED') ||
    normalizedStatus.includes('CANCELLED') ||
    normalizedStatus.includes('OVERDUE') ||
    normalizedStatus.includes('FAILED')
  ) {
    return 'danger';
  }

  if (
    normalizedStatus.includes('PENDING') ||
    normalizedStatus.includes('AWAITING') ||
    normalizedStatus.includes('PAUSED')
  ) {
    return 'warning';
  }

  if (normalizedStatus.includes('ASSIGNED') || normalizedStatus.includes('IN_PROGRESS')) {
    return 'info';
  }

  return 'neutral';
};

const eventTimestamp = (event: HomeManagementTimelineEvent) => {
  const timestamp = new Date(event.occurredAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const timestampLabel = (occurredAt: string) => {
  const timestamp = new Date(occurredAt).getTime();
  return Number.isNaN(timestamp) ? 'Recorded activity' : formatRelativeTime(occurredAt);
};

const locationLabel = (event: HomeManagementTimelineEvent) => {
  const propertyName = event.property?.title ?? event.property?.name;
  const unitName = event.unit?.unitName ?? event.unit?.name;

  if (propertyName && unitName) return `${propertyName} · ${unitName}`;
  return propertyName ?? unitName ?? 'Property context unavailable';
};

interface HomeManagementTimelineProps {
  propertyId?: string;
  limit?: number;
}

export function HomeManagementTimeline({
  propertyId,
  limit = DEFAULT_TIMELINE_LIMIT,
}: HomeManagementTimelineProps) {
  const effectiveLimit = Math.min(
    Math.max(Number.isFinite(limit) ? Math.trunc(limit) : DEFAULT_TIMELINE_LIMIT, 1),
    MAX_TIMELINE_LIMIT
  );
  const queryParams = useMemo(
    () => ({ propertyId, limit: effectiveLimit }),
    [effectiveLimit, propertyId]
  );
  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: homeManagementKeys.timeline(queryParams),
    queryFn: () => unwrap(homeManagementService.listTimeline(queryParams)),
  });
  const timelineEvents = useMemo(
    () =>
      [...events]
        .sort((first, second) => eventTimestamp(second) - eventTimestamp(first))
        .slice(0, effectiveLimit),
    [effectiveLimit, events]
  );

  return (
    <section aria-labelledby="home-management-timeline-heading" className="mt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Service history</p>
          <h2
            id="home-management-timeline-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            A complete operational trail for every home.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Follow care, service, inspection, asset, and approval activity in one chronological
            record.
          </p>
        </div>
        {!isLoading && timelineEvents.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Latest {timelineEvents.length} {timelineEvents.length === 1 ? 'event' : 'events'}
          </p>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <TimelineLoadingState />
        ) : error ? (
          <EmptyState
            icon={CircleAlert}
            title="Service history could not be loaded"
            description="Refresh the page to try again. Your operational records remain unchanged."
          />
        ) : timelineEvents.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No service activity yet"
            description="Asset updates, scheduled care, work orders, inspections, and approvals will be recorded here as your homes are operated."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="divide-y divide-border">
              {timelineEvents.map((event) => {
                const eventMeta = getEventMeta(event.type);
                const Icon = eventMeta.icon;
                const isValidTimestamp = eventTimestamp(event) > 0;

                return (
                  <article
                    key={event.id}
                    className="grid gap-4 px-5 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${eventMeta.iconClassName}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                        {event.status && (
                          <Badge variant={statusVariant(event.status)}>
                            {toLabel(event.status)}
                          </Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                      <p className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{locationLabel(event)}</span>
                      </p>
                    </div>

                    <div className="text-left md:min-w-28 md:text-right">
                      <p className="text-xs text-muted-foreground">Recorded</p>
                      {isValidTimestamp ? (
                        <time
                          dateTime={event.occurredAt}
                          title={formatDate(event.occurredAt, 'full')}
                          className="mt-1 block text-sm font-medium text-foreground"
                        >
                          {timestampLabel(event.occurredAt)}
                        </time>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                          Recorded activity
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TimelineLoadingState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse border-b border-border bg-gradient-to-r from-transparent via-secondary/70 to-transparent last:border-b-0"
        />
      ))}
    </div>
  );
}
