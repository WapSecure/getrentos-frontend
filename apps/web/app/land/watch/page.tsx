import { Suspense } from 'react';
import { LandWatchWorkspace } from '@/components/land/watch/LandWatchWorkspace';

export default function LandWatchPage() {
  return (
    <Suspense>
      <LandWatchWorkspace />
    </Suspense>
  );
}
