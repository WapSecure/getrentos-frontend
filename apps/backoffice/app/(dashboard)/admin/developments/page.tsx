'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from '@sureground/icons';
import {
  Badge,
  Card,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@sureground/ui';
import { formatDate, unwrap } from '@sureground/shared';
import {
  STATUS_BADGE,
  adminDevelopmentsService,
  type AdminDevelopmentQueue,
} from '@/services/adminDevelopmentsService';

export default function DevelopmentChecksPage() {
  const [view, setView] = useState<AdminDevelopmentQueue>('IN_REVIEW');
  const query = useQuery({
    queryKey: ['admin', 'developments', view],
    queryFn: () => unwrap(adminDevelopmentsService.list(view)),
  });
  const rows = query.data ?? [];

  return (
    <>
      <PageHeader
        title="Development checks"
        description="Off-plan developments wait here until you check the developer's CAC registration, the directors' identities, the title to the site and the building plan approval. Only a development with all four passed can go live. Sureground holds no money for these: buyers pay the developer."
      />

      <Tabs value={view} onValueChange={(v) => setView(v as AdminDevelopmentQueue)}>
        <TabsList className="mb-4">
          <TabsTrigger value="IN_REVIEW">Awaiting checks</TabsTrigger>
          <TabsTrigger value="LIVE">Live</TabsTrigger>
          <TabsTrigger value="CHANGES_REQUESTED">Sent back</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load developments"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={view === 'IN_REVIEW' ? 'Nothing to check' : 'No developments here'}
          description={
            view === 'IN_REVIEW'
              ? 'No developer has sent a development for checks.'
              : 'Developments in this state appear here.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((d) => (
            <li key={d.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/developments/${d.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {d.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[
                        d.developerName,
                        `${d.city}, ${d.state}`,
                        `${d.checksPassed} of 4 checks passed`,
                        d.submittedAt ? `sent ${formatDate(d.submittedAt)}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <Badge variant={STATUS_BADGE[d.status].variant}>
                    {STATUS_BADGE[d.status].label}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
