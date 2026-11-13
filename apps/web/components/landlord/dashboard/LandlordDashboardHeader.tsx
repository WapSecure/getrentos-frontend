'use client';

import { Plus } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { DashboardHeader } from '@/components/shared/dashboard/DashboardHeader';
import { ROUTES } from '@/lib/constants/auth';

interface LandlordDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const LandlordDashboardHeader = ({ greeting, firstName }: LandlordDashboardHeaderProps) => (
  <DashboardHeader
    title={`${greeting}, ${firstName}`}
    description="Track your portfolio, rent collection, and the work that needs your attention."
    action={
      <Button href={ROUTES.LANDLORD_PROPERTIES} variant="primary" size="lg" icon={<Plus />}>
        Add property
      </Button>
    }
  />
);
