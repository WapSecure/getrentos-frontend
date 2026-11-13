'use client';

import { Building2, Megaphone, FileText, BellRing } from '@sureground/icons';
import { QuickActionsCard } from '@/components/shared/dashboard/QuickActionsCard';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  {
    label: 'Manage properties',
    description: 'Add or update your portfolio',
    href: ROUTES.LANDLORD_PROPERTIES,
    icon: Building2,
  },
  {
    label: 'Manage listings',
    description: 'Prepare a property for the market',
    href: ROUTES.LANDLORD_LISTINGS,
    icon: Megaphone,
  },
  {
    label: 'Review applications',
    description: 'Find your next tenant',
    href: ROUTES.LANDLORD_APPLICATIONS,
    icon: FileText,
  },
  {
    label: 'Rent and reminders',
    description: 'Follow up on unpaid charges',
    href: ROUTES.LANDLORD_PAYMENTS,
    icon: BellRing,
  },
];

export const LandlordQuickActions = () => <QuickActionsCard actions={actions} />;
