'use client';

import { Search } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { DashboardHeader } from '@/components/shared/dashboard/DashboardHeader';
import { ROUTES } from '@/lib/constants/auth';

interface BuyerDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const BuyerDashboardHeader = ({ greeting, firstName }: BuyerDashboardHeaderProps) => (
  <DashboardHeader
    title={`${greeting}, ${firstName}`}
    description="Review saved properties, upcoming viewings, offers, and active purchases."
    action={
      <Button href={ROUTES.BUYER_DISCOVER} variant="primary" size="lg" icon={<Search />}>
        Discover properties
      </Button>
    }
  />
);
