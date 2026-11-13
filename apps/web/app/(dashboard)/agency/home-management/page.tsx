'use client';

import { HomeManagementWorkspace } from '@/components/home-management/HomeManagementWorkspace';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';
import { useCustody } from '@/components/agency/CustodyProvider';

export default function AgencyHomeManagementPage() {
  const { selected } = useCustody();
  const scope = selected
    ? (selected.propertyTitle ?? 'the selected property') +
      (selected.ownerName ? `, for ${selected.ownerName}` : '')
    : null;

  return (
    <div className="p-6">
      <ProFeatureGate
        title="Home Management is a Pro feature"
        description="Upgrade to Pro to run maintenance with service targets, vendor work orders, quotes and invoicing for the properties you manage."
      >
        <HomeManagementWorkspace
          role="manager"
          scopePropertyId={selected?.propertyId}
          description={
            scope
              ? `Work orders, care plans, assets and records for ${scope}. Choose another client above to see their home.`
              : undefined
          }
        />
      </ProFeatureGate>
    </div>
  );
}
