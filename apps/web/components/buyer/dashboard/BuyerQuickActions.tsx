'use client';

import { Search, CalendarClock, Handshake, FileUp } from '@sureground/icons';
import { QuickActionsCard } from '@/components/shared/dashboard/QuickActionsCard';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  {
    label: 'Discover properties',
    description: 'Browse homes listed for sale',
    href: ROUTES.BUYER_DISCOVER,
    icon: Search,
  },
  {
    label: 'Request viewing',
    description: 'Book a time to see a property',
    href: ROUTES.BUYER_VIEWINGS,
    icon: CalendarClock,
  },
  {
    label: 'View offers',
    description: 'Follow the offers you have made',
    href: ROUTES.BUYER_OFFERS,
    icon: Handshake,
  },
  {
    label: 'Upload documents',
    description: 'Keep your purchase papers together',
    href: ROUTES.BUYER_DOCUMENTS,
    icon: FileUp,
  },
];

export const BuyerQuickActions = () => <QuickActionsCard actions={actions} />;
