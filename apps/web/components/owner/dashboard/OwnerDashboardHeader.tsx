'use client';

import { Plus } from 'lucide-react';
import { Button, PageHeader } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

interface OwnerDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const OwnerDashboardHeader = ({ greeting, firstName }: OwnerDashboardHeaderProps) => {
  return (
    <PageHeader
      title={`${greeting}, ${firstName}`}
      description="Track your properties, active listings, offers, and completed sales."
      actions={
        <Button href={ROUTES.OWNER_PROPERTIES} variant="primary" size="lg" icon={<Plus />}>
          Add property
        </Button>
      }
    />
  );
};
