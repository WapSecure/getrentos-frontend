'use client';

import { Plus } from 'lucide-react';
import { Button, PageHeader } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

interface LandlordDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const LandlordDashboardHeader = ({ greeting, firstName }: LandlordDashboardHeaderProps) => {
  return (
    <PageHeader
      title={`${greeting}, ${firstName}`}
      description="Track your portfolio, rent collection, and the work that needs your attention."
      actions={
        <Button
          href={ROUTES.LANDLORD_PROPERTIES}
          variant="primary"
          size="lg"
          className="shrink-0 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add property
        </Button>
      }
    />
  );
};
