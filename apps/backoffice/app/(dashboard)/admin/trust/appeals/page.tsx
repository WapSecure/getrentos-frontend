'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gavel } from 'lucide-react';
import { CardSkeleton, EmptyState, PageErrorState, PageHeader } from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import { AppealCard } from '@/components/admin/trust/AppealCard';
import { AppealResolveModal } from '@/components/admin/trust/AppealResolveModal';
import { trustService } from '@/services/trustService';
import { adminKeys } from '@/lib/queryKeys';
import type { TrustAppeal } from '@/types/trust';

export default function TrustAppealsPage() {
  const [activeAppeal, setActiveAppeal] = useState<TrustAppeal | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.trustAppeals,
    queryFn: () => unwrap(trustService.listAppeals()),
  });
  const appeals = data ?? [];

  return (
    <>
      <PageHeader
        title="Trust Appeals"
        description="Subjects contesting a rejected property-authority claim or a failed verification. An appeal must be resolved by someone other than the officer who made the original decision; overturning it reopens the decision for re-review."
      />

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} lines={4} />
          ))}
        </div>
      ) : isError && !data ? (
        <PageErrorState
          title="Could not load appeals"
          description="The trust appeal queue is temporarily unavailable."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : appeals.length === 0 ? (
        <EmptyState icon={Gavel} title="No appeals waiting" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {appeals.map((appeal, index) => (
            <AppealCard
              key={appeal.id}
              appeal={appeal}
              delay={index * 0.05}
              onReview={() => setActiveAppeal(appeal)}
            />
          ))}
        </div>
      )}

      <AppealResolveModal appeal={activeAppeal} onClose={() => setActiveAppeal(null)} />
    </>
  );
}
