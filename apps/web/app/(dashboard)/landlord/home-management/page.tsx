'use client';

import { HomeManagementWorkspace } from '@/components/home-management/HomeManagementWorkspace';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

export default function LandlordHomeManagementPage() {
  return (
    <ProFeatureGate
      title="Home Management is a Pro feature"
      description="Upgrade to Pro to unlock SLA-backed maintenance timelines, vendor work orders, quotes, and invoicing."
    >
      <HomeManagementWorkspace role="landlord" />
    </ProFeatureGate>
  );
}
