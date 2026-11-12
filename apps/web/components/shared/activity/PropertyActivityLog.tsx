'use client';

import { useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Building2 } from '@sureground/icons';
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  PageHeader,
} from '@sureground/ui';

import { unwrap } from '@/lib/apiHelpers';
import { ownerActivity } from '@/services/ownerActivityService';
import { ActivityFeed } from './ActivityFeed';

// Leaves out the owner's own actions, and shows nothing beyond who, what, where and when.
export const PropertyActivityLog = () => {
  const [propertyId, setPropertyId] = useState('');
  const [who, setWho] = useState<'managers' | 'everyone'>('everyone');

  const feed = useInfiniteQuery({
    queryKey: ['owner-activity', propertyId, who],
    queryFn: ({ pageParam }) =>
      unwrap(ownerActivity({ propertyId: propertyId || undefined, who, before: pageParam })),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextBefore,
    placeholderData: keepPreviousData,
  });

  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const properties = feed.data?.pages[0]?.properties ?? [];
  return (
    <>
      <PageHeader
        title="Activity log"
        description="What your managers, Sureground, tenants and automatic jobs have done on your properties. Your own actions are not listed."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-72">
          <Select
            ariaLabel="Property"
            value={propertyId}
            onValueChange={setPropertyId}
            options={[
              { value: '', label: 'All properties' },
              ...properties.map((p) => ({ value: p.id, label: p.title })),
            ]}
          />
        </div>
        <Tabs value={who} onValueChange={(v) => setWho(v as 'managers' | 'everyone')}>
          <TabsList aria-label="Whose actions">
            <TabsTrigger value="everyone">Everyone</TabsTrigger>
            <TabsTrigger value="managers">Managers only</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {feed.isLoading ? (
        <ListSkeleton rows={5} />
      ) : feed.isError && !feed.data ? (
        <PageErrorState
          headingLevel="h2"
          title="Could not load the activity log"
          description={(feed.error as Error).message || undefined}
          onRetry={() => void feed.refetch()}
          isRetrying={feed.isFetching}
          className="min-h-0 py-10"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nothing yet"
          description="When someone acts on your properties, it shows up here."
        />
      ) : (
        <div className="space-y-6">
          <ActivityFeed items={items} />
          {feed.hasNextPage && (
            <Button
              variant="outline"
              isLoading={feed.isFetchingNextPage}
              onClick={() => void feed.fetchNextPage()}
            >
              Show older activity
            </Button>
          )}
        </div>
      )}
    </>
  );
};
