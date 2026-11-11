'use client';

import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Activity,
  Boxes,
  CalendarClock,
  CircleAlert,
  ClipboardCheck,
  FileText,
  MapPin,
  Wrench,
  type SgIcon,
} from '@sureground/icons';
import { Badge, Timeline, type BadgeVariant } from '@sureground/ui';
import { EmptyState } from '@sureground/ui';
import { ListSkeleton } from '@sureground/ui';
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
  icon: SgIcon;
  iconClassName: string;
};

const defaultEventMeta: TimelineEventMeta = {
  icon: Activity,
  iconClassName: 'text-muted-foreground',
};

const getEventMeta = (type: string): TimelineEventMeta => {
  const normalizedType = type.toUpperCase();

  if (
    normalizedType.includes('WORK_ORDER') ||
    normalizedType.includes('MAINTENANCE') ||
    normalizedType.includes('SERVICE') ||
    normalizedType.includes('VENDOR')
  ) {
    return { icon: Wrench, iconClassName: 'text-warning' };
  }

  if (
    normalizedType.includes('PLAN') ||
    normalizedType.includes('SCHEDULE') ||
    normalizedType.includes('CARE')
  ) {
    return { icon: CalendarClock, iconClassName: 'text-primary' };
  }

  if (normalizedType.includes('INSPECTION') || normalizedType.includes('FIELD')) {
    return {
      icon: ClipboardCheck,
      iconClassName: 'text-success',
    };
  }

  if (normalizedType.includes('ASSET') || normalizedType.includes('WARRANTY')) {
    return { icon: Boxes, iconClassName: 'text-foreground' };
  }

  if (normalizedType.includes('DOCUMENT') || normalizedType.includes('RECORD')) {
    return { icon: FileText, iconClassName: 'text-info' };
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
    placeholderData: keepPreviousData,
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
          <ListSkeleton rows={4} className="rounded-2xl" />
        ) : error && events.length === 0 ? (
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
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <Timeline
              variant="feed"
              titleAs="h3"
              aria-labelledby="home-management-timeline-heading"
              items={timelineEvents.map((event) => {
                const eventMeta = getEventMeta(event.type);
                const Icon = eventMeta.icon;
                return {
                  id: event.id,
                  title: event.title,
                  state: 'done' as const,
                  icon: (
                    <Icon className={`h-4 w-4 ${eventMeta.iconClassName}`} aria-hidden="true" />
                  ),
                  badge: event.status ? (
                    <Badge variant={statusVariant(event.status)}>{toLabel(event.status)}</Badge>
                  ) : undefined,
                  date:
                    eventTimestamp(event) > 0 ? (
                      <>
                        Recorded{' '}
                        <time
                          dateTime={event.occurredAt}
                          title={formatDate(event.occurredAt, 'full')}
                        >
                          {timestampLabel(event.occurredAt)}
                        </time>
                      </>
                    ) : (
                      'Recorded activity'
                    ),
                  description: (
                    <>
                      {event.description && (
                        <p className="max-w-3xl text-sm leading-6">{event.description}</p>
                      )}
                      <p className="mt-1 flex max-w-full items-center gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{locationLabel(event)}</span>
                      </p>
                    </>
                  ),
                };
              })}
            />
          </div>
        )}
      </div>
    </section>
  );
}
