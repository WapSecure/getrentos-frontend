'use client';

import { ClientRealtorAccess } from '@/components/realtor/ClientRealtorAccess';
import { PageHeader } from '@sureground/ui';

export default function AgencyRealtorAccessPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Realtor access"
        description="Approve realtors and assign them the properties you manage for your clients."
      />
      <ClientRealtorAccess showHeader={false} />
    </div>
  );
}
