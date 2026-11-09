'use client';

import { Search } from '@sureground/icons';
import { Button, PageHeader } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

interface BuyerDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const BuyerDashboardHeader = ({ greeting, firstName }: BuyerDashboardHeaderProps) => {
  return (
    <PageHeader
      title={`${greeting}, ${firstName}`}
      description="Review saved properties, upcoming viewings, offers, and active purchases."
      actions={
        <Button href={ROUTES.BUYER_DISCOVER} variant="primary" icon={<Search />}>
          Discover properties
        </Button>
      }
    />
  );
};
