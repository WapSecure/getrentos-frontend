'use client';

import { ManagedPropertiesView } from '@/components/shared/authority/ManagedPropertiesView';
import { ROUTES } from '@/lib/constants/auth';

export default function AgentManagedPropertiesPage() {
  // Agents get a "Manage this property" link into the home-management workspace;
  // owner/realtor portals mount the same view without it.
  return <ManagedPropertiesView managePath={ROUTES.AGENT_HOME_MANAGEMENT} />;
}
