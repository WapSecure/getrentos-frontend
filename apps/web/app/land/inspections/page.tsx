import { Suspense } from 'react';
import { InspectorDesk } from '@/components/land/watch/InspectorDesk';

export default function LandInspectionsPage() {
  return (
    <Suspense>
      <InspectorDesk />
    </Suspense>
  );
}
