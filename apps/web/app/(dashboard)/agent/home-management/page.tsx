'use client';

import { HomeManagementWorkspace } from '@/components/home-management/HomeManagementWorkspace';
import { PageHeader } from '@sureground/ui';

// No ProFeatureGate: agents are ungated, and the backend entitles a mandate-holder through the granting owner's plan.
export default function AgentHomeManagementPage() {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow="Work"
        title="Home management"
        description="Assets, care plans, work orders and vendors for the properties you manage."
      />
      <HomeManagementWorkspace role="manager" />
    </div>
  );
}
