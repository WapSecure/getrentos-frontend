import { Suspense } from 'react';
import { OwnerLandWorkspace } from '@/components/land/OwnerLandWorkspace';

export default function OwnerLandPage() {
  // The workspace reads `?property=` to open a parcel directly.
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-secondary" />}>
      <OwnerLandWorkspace />
    </Suspense>
  );
}
