'use client';

import { ManagedPropertiesView } from '@/components/shared/authority/ManagedPropertiesView';
import { ROUTES } from '@/lib/constants/auth';

export default function AgentManagedPropertiesPage() {
  return <ManagedPropertiesView managePath={ROUTES.AGENT_HOME_MANAGEMENT} />;
}
