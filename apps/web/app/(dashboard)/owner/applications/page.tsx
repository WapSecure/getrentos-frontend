'use client';

import { Suspense } from 'react';
import { ROUTES } from '@/lib/constants/auth';
import { RentalApplicationsBoard } from '@/components/shared/lettings/RentalApplicationsBoard';

export default function OwnerApplicationsPage() {
  return (
    <Suspense>
      <RentalApplicationsBoard leasesHref={ROUTES.OWNER_LEASES} />
    </Suspense>
  );
}
