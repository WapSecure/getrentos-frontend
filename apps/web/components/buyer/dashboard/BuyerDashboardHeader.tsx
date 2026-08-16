'use client';

import { Search } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

interface BuyerDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const BuyerDashboardHeader = ({ greeting, firstName }: BuyerDashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your property search.
        </p>
      </div>
      <Button href={ROUTES.BUYER_DISCOVER} variant="primary" className="gap-2">
        <Search className="w-4 h-4" />
        Discover Properties
      </Button>
    </div>
  );
};
