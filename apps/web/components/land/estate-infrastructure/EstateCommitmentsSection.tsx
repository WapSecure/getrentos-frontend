'use client';

import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import {
  estateInfrastructureKeys,
  landEstateInfrastructureService,
} from '@/services/landEstateInfrastructureService';
import { CommitmentCard } from './CommitmentCard';

/** The estate page's "what the developer promised" list; hidden when there is none. */
export const EstateCommitmentsSection = ({ layoutId }: { layoutId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: estateInfrastructureKeys.public(layoutId),
    queryFn: () => unwrap(landEstateInfrastructureService.forEstate(layoutId)),
  });
  if (isLoading) return <Skeleton className="h-32 rounded-2xl" />;
  if (!data || data.length === 0) return null;
  return (
    <section aria-labelledby="infrastructure-heading" className="space-y-4">
      <div>
        <h2 id="infrastructure-heading" className="text-xl font-semibold text-foreground">
          Infrastructure the developer promised
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each promise shows where it stands. GetRentos checks the evidence before marking one
          verified, and buyers are asked before any date or scope changes.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((commitment) => (
          <CommitmentCard key={commitment.id} commitment={commitment} />
        ))}
      </div>
    </section>
  );
};
