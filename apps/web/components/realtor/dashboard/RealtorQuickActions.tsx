'use client';

import { Megaphone, CalendarClock, UserPlus, Users } from '@sureground/icons';
import { QuickActionsCard } from '@/components/shared/dashboard/QuickActionsCard';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  {
    label: 'Add listing',
    description: 'List a property for a client',
    href: ROUTES.REALTOR_LISTINGS,
    icon: Megaphone,
  },
  {
    label: 'Schedule viewing',
    description: 'Arrange a tour with a lead',
    href: ROUTES.REALTOR_VIEWINGS,
    icon: CalendarClock,
  },
  {
    label: 'View leads',
    description: 'Follow up on enquiries',
    href: ROUTES.REALTOR_LEADS,
    icon: UserPlus,
  },
  {
    label: 'Add client',
    description: 'Represent another owner or landlord',
    href: ROUTES.REALTOR_CLIENTS,
    icon: Users,
  },
];

export const RealtorQuickActions = () => <QuickActionsCard actions={actions} />;
