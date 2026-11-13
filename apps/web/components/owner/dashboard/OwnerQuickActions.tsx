'use client';

import { Building2, Megaphone, Handshake, FileUp } from '@sureground/icons';
import { QuickActionsCard } from '@/components/shared/dashboard/QuickActionsCard';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  {
    label: 'Add property',
    description: 'Bring another property into your portfolio',
    href: ROUTES.OWNER_PROPERTIES,
    icon: Building2,
  },
  {
    label: 'Publish listing',
    description: 'Put a property on the market for sale',
    href: ROUTES.OWNER_LISTINGS,
    icon: Megaphone,
  },
  {
    label: 'View offers',
    description: 'Respond to offers from buyers',
    href: ROUTES.OWNER_OFFERS,
    icon: Handshake,
  },
  {
    label: 'Upload ownership docs',
    description: 'Add title papers for verification',
    href: ROUTES.OWNER_DOCUMENTS,
    icon: FileUp,
  },
];

export const OwnerQuickActions = () => <QuickActionsCard actions={actions} />;
