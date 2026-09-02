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
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="mb-2.5 inline-flex items-center rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          Buyer dashboard
        </span>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
          {greeting}, {firstName}!
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Here&apos;s what&apos;s happening with your property search.
        </p>
      </div>
      <Button href={ROUTES.BUYER_DISCOVER} variant="primary" className="shrink-0 gap-2 shadow-sm">
        <Search className="h-4 w-4" />
        Discover Properties
      </Button>
    </div>
  );
};
