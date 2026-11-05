'use client';

import { HomeManagementWorkspace } from '@/components/home-management/HomeManagementWorkspace';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';
import { useCustody } from '@/components/agency/CustodyProvider';
import { PageHeader } from '@getrentos/ui';

export default function AgencyHomeManagementPage() {
  // Acting for one client narrows the whole page to that client's home.
  const { selected } = useCustody();
  const scope = selected
    ? (selected.propertyTitle ?? 'the selected property') +
      (selected.ownerName ? `, for ${selected.ownerName}` : '')
    : null;

  return (
    <div className="p-6">
      <PageHeader
        title="Home management"
        description={
          scope
            ? `Assets, care plans, work orders and vendors for ${scope}. Choose another client above to see their home.`
            : 'Assets, care plans, work orders and vendors across the properties you manage.'
        }
      />
      <ProFeatureGate
        title="Home Management is a Pro feature"
        description="Upgrade to Pro to run SLA-backed maintenance, vendor work orders, quotes and invoicing for the properties you manage."
      >
        <HomeManagementWorkspace role="manager" scopePropertyId={selected?.propertyId} />
      </ProFeatureGate>
    </div>
  );
}
