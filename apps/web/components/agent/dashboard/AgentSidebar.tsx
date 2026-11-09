'use client';

import { RoleSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { agentNavigation } from '@/lib/navigation/roles/agent';

export const AgentSidebar = () => <RoleSidebar config={agentNavigation} />;
