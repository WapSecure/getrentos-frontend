'use client';

import { ShieldCheck } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@getrentos/shared';

interface AdminDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const AdminDashboardHeader = ({ greeting, firstName }: AdminDashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s the state of the platform today.
        </p>
      </div>
      <Button href={ROUTES.ADMIN_VERIFICATIONS} variant="primary" className="gap-2">
        <ShieldCheck className="w-4 h-4" />
        Review Verifications
      </Button>
    </div>
  );
};
