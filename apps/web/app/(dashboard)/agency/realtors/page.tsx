'use client';

import { ClientRealtorAccess } from '@/components/realtor/ClientRealtorAccess';

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
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Realtor access</h1>
        <p className="mt-1 text-muted-foreground">
          Approve realtors and assign them the properties you manage for your clients.
        </p>
      </div>
      <ClientRealtorAccess showHeader={false} />
    </div>
  );
}
