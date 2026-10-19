'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Bot, Building2, History, Loader2, ShieldCheck, UserRound, Wrench } from 'lucide-react';
import { Badge } from '@getrentos/ui';

import { unwrap } from '@/lib/apiHelpers';
import {
  ownerActivity,
  type ActivityActorKind,
  type ActivityItem,
} from '@/services/ownerActivityService';

const KIND: Record<
  ActivityActorKind,
  { label: string; icon: typeof Wrench; variant: 'info' | 'neutral' | 'success' | 'warning' }
> = {
  MANAGER: { label: 'Manager', icon: Wrench, variant: 'info' },
  GETRENTOS: { label: 'GetRentos', icon: ShieldCheck, variant: 'success' },
  TENANT: { label: 'Tenant', icon: UserRound, variant: 'neutral' },
  SYSTEM: { label: 'Automatic', icon: Bot, variant: 'neutral' },
  OTHER: { label: 'Other', icon: UserRound, variant: 'neutral' },
};

const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', {
    timeZone: 'Africa/Lagos',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-NG', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
  });

const selectClass =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

/**
 * The owner's activity log: what managers, GetRentos, tenants and automatic
 * jobs have done on their properties, newest first. The owner's own actions are
 * left out, and nothing is shown beyond who, what, where and when.
 */
export const PropertyActivityLog = () => {
  const [propertyId, setPropertyId] = useState('');
  const [who, setWho] = useState<'managers' | 'everyone'>('everyone');

  const feed = useInfiniteQuery({
    queryKey: ['owner-activity', propertyId, who],
    queryFn: ({ pageParam }) =>
      unwrap(ownerActivity({ propertyId: propertyId || undefined, who, before: pageParam })),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextBefore,
  });

  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const properties = feed.data?.pages[0]?.properties ?? [];
  const days = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const day = dayOf(item.at);
    days.set(day, [...(days.get(day) ?? []), item]);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <History className="h-6 w-6 text-primary" aria-hidden />
          Activity log
        </h1>
        <p className="mt-1 text-muted-foreground">
          What your managers, GetRentos, tenants and automatic jobs have done on your properties.
          Your own actions are not listed.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <select
          aria-label="Property"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className={selectClass}
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <div
          className="inline-flex rounded-lg border border-border p-0.5"
          role="group"
          aria-label="Whose actions"
        >
          {(['everyone', 'managers'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={who === value}
              onClick={() => setWho(value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                who === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {value === 'everyone' ? 'Everyone' : 'Managers only'}
            </button>
          ))}
        </div>
      </div>

      {feed.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activity…</p>
      ) : feed.isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(feed.error as Error).message || 'Could not load the activity log.'}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="font-medium text-foreground">Nothing yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            When someone acts on your properties, it shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...days.entries()].map(([day, list]) => (
            <section key={day}>
              <h2 className="mb-2 text-sm font-semibold text-foreground">{day}</h2>
              <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
                {list.map((item) => {
                  const kind = KIND[item.actorKind];
                  const Icon = kind.icon;
                  return (
                    <li key={item.id} className="flex items-start gap-3 p-4">
                      <div className="shrink-0 rounded-xl bg-muted p-2">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{item.actor}</span> · {item.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.propertyTitle} · {timeOf(item.at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant={kind.variant}>{kind.label}</Badge>
                        {item.important && <Badge variant="warning">Important</Badge>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          {feed.hasNextPage && (
            <button
              type="button"
              disabled={feed.isFetchingNextPage}
              onClick={() => void feed.fetchNextPage()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
            >
              {feed.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Show older activity
            </button>
          )}
        </div>
      )}
    </>
  );
};
