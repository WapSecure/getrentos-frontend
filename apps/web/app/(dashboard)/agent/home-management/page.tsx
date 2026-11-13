'use client';

import { HomeManagementWorkspace } from '@/components/home-management/HomeManagementWorkspace';

// No ProFeatureGate: agents are ungated, and the backend entitles a mandate-holder through the granting owner's plan.
export default function AgentHomeManagementPage() {
  return (
    <div className="p-6">
      <HomeManagementWorkspace role="manager" eyebrow="Work" />
    </div>
  );
}
