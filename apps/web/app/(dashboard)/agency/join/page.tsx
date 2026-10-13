'use client';

import { Suspense } from 'react';
import { AgencyJoinView } from '@/components/agency/AgencyJoinView';

export default function AgencyJoinPage() {
  return (
    <Suspense>
      <AgencyJoinView />
    </Suspense>
  );
}
