'use client';

import { Plus } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { DashboardHeader } from '@/components/shared/dashboard/DashboardHeader';
import { ROUTES } from '@/lib/constants/auth';

interface OwnerDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const OwnerDashboardHeader = ({ greeting, firstName }: OwnerDashboardHeaderProps) => (
  <DashboardHeader
    title={`${greeting}, ${firstName}`}
    description="Track your properties, active listings, offers, and completed sales."
    action={
      <Button href={ROUTES.OWNER_PROPERTIES} variant="primary" size="lg" icon={<Plus />}>
        Add property
      </Button>
    }
  />
);
