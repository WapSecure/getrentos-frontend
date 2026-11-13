'use client';

import { ClipboardCheck, UserCheck, ClipboardList, RefreshCw } from '@sureground/icons';
import { QuickActionsCard } from '@/components/shared/dashboard/QuickActionsCard';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  {
    label: 'Start inspection',
    description: 'Record a property visit',
    href: ROUTES.AGENT_INSPECTIONS,
    icon: ClipboardCheck,
  },
  {
    label: 'Log verification',
    description: 'Confirm a person or document',
    href: ROUTES.AGENT_VERIFICATIONS,
    icon: UserCheck,
  },
  {
    label: 'View tasks',
    description: 'Everything assigned to you',
    href: ROUTES.AGENT_TASKS,
    icon: ClipboardList,
  },
  {
    label: 'Sync centre',
    description: 'Send records saved on this device',
    href: ROUTES.AGENT_SYNC,
    icon: RefreshCw,
  },
];

export const AgentQuickActions = () => <QuickActionsCard actions={actions} />;
