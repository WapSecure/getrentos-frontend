'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants/auth';

interface RealtorDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const RealtorDashboardHeader = ({ greeting, firstName }: RealtorDashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s how your clients and listings are performing.
        </p>
      </div>
      <Button href={ROUTES.REALTOR_LISTINGS} variant="primary" className="gap-2">
        <Plus className="w-4 h-4" />
        Add Listing
      </Button>
    </div>
  );
};
