'use client';

import { Suspense } from 'react';
import { ROUTES } from '@/lib/constants/auth';
import { LandlordLettingsNav } from '@/components/shared/navigation/WorkflowNavs';
import { RentalApplicationsBoard } from '@/components/shared/lettings/RentalApplicationsBoard';

export default function LandlordApplicationsPage() {
  return (
    <Suspense>
      <RentalApplicationsBoard leasesHref={ROUTES.LANDLORD_LEASES} nav={<LandlordLettingsNav />} />
    </Suspense>
  );
}
