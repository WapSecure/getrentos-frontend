'use client';

import { HomeManagementWorkspace } from '@/components/home-management/HomeManagementWorkspace';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

export default function AgencyHomeManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground">Home management</h1>
        <p className="mt-1 text-muted-foreground">
          Assets, care plans, work orders and vendors across the properties you manage.
        </p>
      </div>
      <ProFeatureGate
        title="Home Management is a Pro feature"
        description="Upgrade to Pro to run SLA-backed maintenance, vendor work orders, quotes and invoicing for the properties you manage."
      >
        <HomeManagementWorkspace role="manager" />
      </ProFeatureGate>
    </div>
  );
}
