import { Suspense } from 'react';
import { Skeleton } from '@sureground/ui';
import { OwnerLandWorkspace } from '@/components/land/OwnerLandWorkspace';

export default function OwnerLandPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <OwnerLandWorkspace />
    </Suspense>
  );
}
