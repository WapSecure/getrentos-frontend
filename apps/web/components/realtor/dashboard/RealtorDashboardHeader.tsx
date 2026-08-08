'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RealtorDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const RealtorDashboardHeader = ({ greeting, firstName }: RealtorDashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s how your clients and listings are performing.
        </p>
      </div>
      <Button href="/realtor/listings" variant="primary" className="gap-2">
        <Plus className="w-4 h-4" />
        Add Listing
      </Button>
    </div>
  );
};
