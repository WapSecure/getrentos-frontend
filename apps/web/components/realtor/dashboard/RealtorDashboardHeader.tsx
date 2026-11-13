'use client';

import { Plus } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { DashboardHeader } from '@/components/shared/dashboard/DashboardHeader';
import { ROUTES } from '@/lib/constants/auth';

interface RealtorDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const RealtorDashboardHeader = ({ greeting, firstName }: RealtorDashboardHeaderProps) => (
  <DashboardHeader
    title={`${greeting}, ${firstName}`}
    description="Track clients, listings, leads, viewings, offers, and commissions."
    action={
      <Button href={ROUTES.REALTOR_LISTINGS} variant="primary" size="lg" icon={<Plus />}>
        Add listing
      </Button>
    }
  />
);
