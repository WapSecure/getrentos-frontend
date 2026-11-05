'use client';

import { ClientRealtorAccess } from '@/components/realtor/ClientRealtorAccess';
import { PageHeader } from '@getrentos/ui';

/**
 * Realtor access for the properties a manager operates on an owner's behalf.
 *
 * Reuses the owner/landlord ClientRealtorAccess view: the backend scopes realtor
 * relationships and assignable properties to the owners the manager holds an
 * active mandate for, so a realtor can only ever be assigned mandated properties.
 */
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
