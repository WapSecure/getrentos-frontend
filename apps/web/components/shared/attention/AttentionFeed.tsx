'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Skeleton } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { attentionKeys } from '@/lib/queryKeys';
import { attentionService } from '@/services/attentionService';
import type { AttentionPersona } from '@/types/attention';
import { AttentionList } from './AttentionList';

export type { AttentionPersona };

export function AttentionFeed({
  persona,
  estateId,
}: {
  persona: AttentionPersona;
  estateId?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: attentionKeys.feed(persona, estateId),
    queryFn: () => unwrap(attentionService.get(persona, estateId)),
    enabled: persona !== 'estate' || Boolean(estateId),
    staleTime: 60_000,
  });

  // Carries its own margin for dashboards that space sections by margin; under a space-y parent the class margin wins, so nothing doubles.
  if (isLoading) {
    return (
      <Card className="mb-6 p-4 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }
  if (!data?.items.length) return null;

  return <AttentionList items={data.items} className="mb-6" />;
}
