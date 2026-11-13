'use client';

import { PageHeader } from '@sureground/ui';
import { LandlordLettingsNav } from '@/components/shared/navigation/WorkflowNavs';
import { RentalViewingRequests } from '@/components/shared/viewings/RentalViewingRequests';

export default function LandlordViewingRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lettings"
        title="Viewing requests"
        description="Renters who want to see a property before applying. Confirm a time or decline."
      />
      <LandlordLettingsNav />
      <RentalViewingRequests />
    </div>
  );
}
