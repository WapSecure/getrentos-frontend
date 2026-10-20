import { Suspense } from 'react';
import { Skeleton } from '@getrentos/ui';
import { OwnerLandWorkspace } from '@/components/land/OwnerLandWorkspace';

export default function OwnerLandPage() {
  // The workspace reads `?property=` to open a parcel directly.
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <OwnerLandWorkspace />
    </Suspense>
  );
}
