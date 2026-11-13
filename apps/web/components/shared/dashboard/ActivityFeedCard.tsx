'use client';

import { useState, type ElementType } from 'react';
import Link from 'next/link';
import type { SgIcon } from '@sureground/icons';
import { Button, Card, EmptyState, Skeleton } from '@sureground/ui';
import { formatRelativeTime } from '@/lib/format';

export interface ActivityFeedItem {
  id: string;
  icon: ElementType;
  title: string;
  detail?: string;
  /** ISO date-time. */
  at: string;
  href?: string;
}

interface ActivityFeedCardProps {
  description: string;
  items: ActivityFeedItem[];
  isLoading?: boolean;
  emptyIcon: SgIcon;
  /** The role's full activity page, when it has one. */
  viewAllHref?: string;
  /** Rows shown before "Show more"; the dashboard should stay a glance, not a log. */
  initialCount?: number;
}

const rowClass = 'flex items-center gap-3.5 px-5 py-3';

function Row({ item }: { item: ActivityFeedItem }) {
  const Icon = item.icon;
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {item.title}
        </span>
        {item.detail && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground" title={item.detail}>
            {item.detail}
          </span>
        )}
      </span>
      <time
        dateTime={item.at}
        className="shrink-0 self-start pt-0.5 text-xs text-muted-foreground tabular-nums"
      >
        {formatRelativeTime(item.at)}
      </time>
    </>
  );
  return item.href ? (
    <Link
      href={item.href}
      className={`${rowClass} group transition-colors hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`}
    >
      {body}
    </Link>
  ) : (
    <div className={rowClass}>{body}</div>
  );
}

/** The dashboard's "Recent activity" for every role: compact rows, the latest few, then more on request. */
export function ActivityFeedCard({
  description,
  items,
  isLoading = false,
  emptyIcon,
  viewAllHref,
  initialCount = 5,
}: ActivityFeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, initialCount);
  const hidden = items.length - shown.length;

  return (
    <Card>
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
          Recent activity
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>

      {isLoading ? (
        <div role="status" aria-label="Loading activity" className="divide-y divide-border">
          {[0, 1, 2].map((row) => (
            <div key={row} className={rowClass}>
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title="No activity yet"
          description="Updates will appear here as things happen."
          size="compact"
          bare
        />
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((item) => (
            <li key={item.id}>
              <Row item={item} />
            </li>
          ))}
        </ul>
      )}

      {!isLoading && (hidden > 0 || expanded || viewAllHref) && items.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-2">
          {hidden > 0 || expanded ? (
            <Button
              variant="link"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? 'Show less' : `Show ${hidden} more`}
            </Button>
          ) : (
            <span />
          )}
          {viewAllHref && (
            <Button variant="link" size="sm" href={viewAllHref}>
              View all activity
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
