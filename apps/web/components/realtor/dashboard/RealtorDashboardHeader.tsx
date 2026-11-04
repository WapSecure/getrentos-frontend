'use client';

import { Plus } from 'lucide-react';
import { Button, PageHeader } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

interface RealtorDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const RealtorDashboardHeader = ({ greeting, firstName }: RealtorDashboardHeaderProps) => {
  return (
    <PageHeader
      title={`${greeting}, ${firstName}`}
      description="Track clients, listings, leads, viewings, offers, and commissions."
      actions={
        <Button href={ROUTES.REALTOR_LISTINGS} variant="primary" icon={<Plus />}>
          Add listing
        </Button>
      }
    />
  );
};
