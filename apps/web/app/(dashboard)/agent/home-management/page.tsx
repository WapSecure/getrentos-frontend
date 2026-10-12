'use client';

import { HomeManagementWorkspace } from '@/components/home-management/HomeManagementWorkspace';

/**
 * A field agent granted an ACTIVE manage mandate operates the property here.
 *
 * Reuses the shared workspace with role="manager": that variant already lists
 * the properties mandated to the caller (via propertyAuthorityService.managed())
 * and every section scopes to them server-side. No ProFeatureGate — agents are
 * ungated by design, and the backend entitles a mandate-holder through the owner
 * who granted the mandate, not the agent's own (non-existent) plan.
 */
export default function AgentHomeManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground">Home management</h1>
        <p className="mt-1 text-muted-foreground">
          Assets, care plans, work orders and vendors for the properties you manage.
        </p>
      </div>
      <HomeManagementWorkspace role="manager" />
    </div>
  );
}
